from flask import Flask, request, jsonify, send_file
from flask_cors import CORS # type: ignore
from pymongo import MongoClient # type: ignore
from bson.objectid import ObjectId # type: ignore
import gridfs # type: ignore

app = Flask(__name__)
CORS(app)

client = MongoClient('mongodb://localhost:27017/')
db = client['cycle_rental_system']
cycles_collection = db['cycles']
orders_collection = db['orders']
fs = gridfs.GridFS(db)

@app.route('/cycles', methods=['GET'])
def get_cycles():
    try:
        print("Fetching cycles from the database...")
        cycles = list(cycles_collection.find())
        print(f"Retrieved {len(cycles)} cycles from the database.")
        for cycle in cycles:
            cycle['_id'] = str(cycle['_id'])
            if 'photo_id' in cycle and cycle['photo_id']:
                cycle['photo_url'] = f"http://localhost:8080/photos/{cycle['photo_id']}"
        return jsonify(cycles)
    except Exception as e:
        print(f"Error occurred while fetching cycles: {e}")
        return jsonify({"error": "Failed to retrieve cycles"}), 500


@app.route('/add_cycle', methods=['POST'])
def add_cycle():
    name = request.form['name']
    cost = request.form['cost']
    photo = request.files.get('photo')

    if photo:
        if photo.content_length > 5 * 1024 * 1024:
            return jsonify({"error": "File size should be less than 5MB"}), 400
        photo_id = fs.put(photo, filename=photo.filename)
    else:
        photo_id = None

    cycle = {
        'name': name,
        'cost': cost,
        'photo_id': photo_id,
        'available': True
    }

    cycles_collection.insert_one(cycle)
    return jsonify({'msg': 'Cycle added successfully'})

@app.route('/rent_cycle/<cycle_id>', methods=['POST'])
def rent_cycle(cycle_id):
    cycles_collection.update_one({'_id': ObjectId(cycle_id)}, {'$set': {'available': False}})
    order = {
        'cycle_id': cycle_id,
        'user': request.form['user'],
        'rental_date': request.form['rental_date']
    }
    orders_collection.insert_one(order)
    return jsonify({'msg': 'Cycle rented successfully'})

@app.route('/return_cycle/<cycle_id>', methods=['POST'])
def return_cycle(cycle_id):
    cycles_collection.update_one({'_id': ObjectId(cycle_id)}, {'$set': {'available': True}})
    orders_collection.delete_one({'cycle_id': cycle_id})
    return jsonify({'msg': 'Cycle returned successfully'})

@app.route('/orders', methods=['GET'])
def get_orders():
    orders = list(orders_collection.find())
    for order in orders:
        order['_id'] = str(order['_id'])
        order['cycle_id'] = str(order['cycle_id'])
    return jsonify(orders)

@app.route('/photos/<photo_id>')
def get_photo(photo_id):
    try:
        photo = fs.get(ObjectId(photo_id))
        return send_file(photo, mimetype='image/jpeg')  # Adjust MIME type as needed
    except gridfs.errors.NoFile:
        return jsonify({'error': 'Photo not found'}), 404

if __name__ == '__main__':
    app.run(port=8080, debug=True)
