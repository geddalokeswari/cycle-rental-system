from flask import Flask, request, jsonify, send_file
from flask_cors import CORS # type: ignore
from pymongo import MongoClient # type: ignore
from bson.objectid import ObjectId # type: ignore
import gridfs # type: ignore
import logging
from bson import json_util # type: ignore
import json

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

client = MongoClient('mongodb://localhost:27017/')
db = client['cycle_rental_system']
cycles_collection = db['cycles']
orders_collection = db['orders']
fs = gridfs.GridFS(db)

def serialize_object(obj):
    def convert(o):
        if isinstance(o, ObjectId):
            return str(o)
        return o

    return json.loads(json_util.dumps(obj), object_hook=convert)

@app.route('/cycles', methods=['GET'])
def get_cycles():
    try:
        app.logger.info("Fetching cycles from the database...")
        cycles = list(cycles_collection.find())
        app.logger.info(f"Retrieved {len(cycles)} cycles from the database.")
        serialized_cycles = serialize_object(cycles)
        for cycle in serialized_cycles:
            if 'photo_id' in cycle and cycle['photo_id']:
                cycle['photo_url'] = f"http://localhost:8080/photos/{str(cycle['photo_id'])}"
        app.logger.info(f"Serialized cycles: {serialized_cycles}")
        return jsonify(serialized_cycles)
    except Exception as e:
        app.logger.error(f"Error occurred while fetching cycles: {str(e)}")
        return jsonify({"error": "Failed to retrieve cycles", "details": str(e)}), 500

@app.route('/photos/<photo_id>')
def get_photo(photo_id):
    try:
        # Convert string back to ObjectId
        object_id = ObjectId(photo_id)
        photo = fs.get(object_id)
        return send_file(photo, mimetype='image/jpeg')
    except Exception as e:
        app.logger.error(f"Error serving photo {photo_id}: {str(e)}")
        return jsonify({'error': 'Error serving photo'}), 500


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

    result = cycles_collection.insert_one(cycle)
    return jsonify({'msg': 'Cycle added successfully', 'id': str(result.inserted_id)})

@app.route('/rent_cycle/<cycle_id>', methods=['POST'])
def rent_cycle(cycle_id):
    cycles_collection.update_one({'_id': ObjectId(cycle_id)}, {'$set': {'available': False}})
    order = {
        'cycle_id': ObjectId(cycle_id),
        'user': request.form['user'],
        'rental_date': request.form['rental_date']
    }
    result = orders_collection.insert_one(order)
    return jsonify({'msg': 'Cycle rented successfully', 'order_id': str(result.inserted_id)})

@app.route('/return_cycle/<cycle_id>', methods=['POST'])
def return_cycle(cycle_id):
    cycles_collection.update_one({'_id': ObjectId(cycle_id)}, {'$set': {'available': True}})
    orders_collection.delete_one({'cycle_id': ObjectId(cycle_id)})
    return jsonify({'msg': 'Cycle returned successfully'})

@app.route('/orders', methods=['GET'])
def get_orders():
    orders = list(orders_collection.find())
    serialized_orders = serialize_object(orders)
    return jsonify(serialized_orders)

if __name__ == '__main__':
    app.run(port=8080, debug=True)