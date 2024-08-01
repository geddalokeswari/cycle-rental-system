from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
import gridfs
import logging

app = Flask(__name__)
CORS(app)

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
        elif isinstance(o, dict):
            return {k: convert(v) for k, v in o.items()}
        elif isinstance(o, list):
            return [convert(i) for i in o]
        return o

    return convert(obj)

@app.route('/cycles', methods=['GET'])
def get_cycles():
    try:
        app.logger.info("Fetching cycles from the database...")
        cycles = list(cycles_collection.find())
        app.logger.info(f"Retrieved {len(cycles)} cycles from the database.")
        serialized_cycles = serialize_object(cycles)
        for cycle in serialized_cycles:
            if 'photo_id' in cycle and cycle['photo_id']:
                photo_id_str = str(cycle['photo_id'])
                cycle['photo_url'] = f"http://localhost:8080/photos/{photo_id_str}"
            else:
                cycle['photo_url'] = None
        app.logger.info(f"Serialized cycles: {serialized_cycles}")
        return jsonify(serialized_cycles)
    except Exception as e:
        app.logger.error(f"Error occurred while fetching cycles: {str(e)}")
        return jsonify({"error": "Failed to retrieve cycles", "details": str(e)}), 500

@app.route('/photos/<photo_id>', methods=['GET'])
def get_photo(photo_id):
    try:
        app.logger.info(f"Serving photo with ID: {photo_id}")

        try:
            object_id = ObjectId(photo_id)
        except Exception as e:
            app.logger.error(f"Invalid ObjectId format: {photo_id}. Error: {str(e)}")
            return jsonify({'error': 'Invalid photo ID format'}), 400

        photo = fs.get(object_id)
        return send_file(
            photo,
            mimetype=photo.content_type or 'image/jpeg',
            as_attachment=False
        )
    except Exception as e:
        app.logger.error(f"Error serving photo {photo_id}: {str(e)}")
        return jsonify({'error': 'Error serving photo'}), 500

@app.route('/add_cycle', methods=['POST'])
def add_cycle():
    try:
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
    except Exception as e:
        app.logger.error(f"Error occurred while adding cycle: {str(e)}")
        return jsonify({"error": "Failed to add cycle", "details": str(e)}), 500

@app.route('/rent_cycle/<cycle_id>', methods=['POST'])
def rent_cycle(cycle_id):
    try:
        cycles_collection.update_one({'_id': ObjectId(cycle_id)}, {'$set': {'available': False}})
        order = {
            'cycle_id': ObjectId(cycle_id),
            'user': request.form['user'],
            'rental_date': request.form['rental_date']
        }
        result = orders_collection.insert_one(order)
        return jsonify({'msg': 'Cycle rented successfully', 'order_id': str(result.inserted_id)})
    except Exception as e:
        app.logger.error(f"Error occurred while renting cycle: {str(e)}")
        return jsonify({"error": "Failed to rent cycle", "details": str(e)}), 500

@app.route('/return_cycle/<cycle_id>', methods=['POST'])
def return_cycle(cycle_id):
    try:
        cycles_collection.update_one({'_id': ObjectId(cycle_id)}, {'$set': {'available': True}})
        orders_collection.delete_one({'cycle_id': ObjectId(cycle_id)})
        return jsonify({'msg': 'Cycle returned successfully'})
    except Exception as e:
        app.logger.error(f"Error occurred while returning cycle: {str(e)}")
        return jsonify({"error": "Failed to return cycle", "details": str(e)}), 500

@app.route('/orders', methods=['GET'])
def get_orders():
    try:
        orders = list(orders_collection.find())
        serialized_orders = serialize_object(orders)
        return jsonify(serialized_orders)
    except Exception as e:
        app.logger.error(f"Error occurred while fetching orders: {str(e)}")
        return jsonify({"error": "Failed to retrieve orders", "details": str(e)}), 500

@app.route('/cycles/<cycle_id>', methods=['GET'])
def get_cycle(cycle_id):
    try:
        cycle = cycles_collection.find_one({'_id': ObjectId(cycle_id)})
        if cycle:
            serialized_cycle = serialize_object(cycle)
            if 'photo_id' in serialized_cycle and serialized_cycle['photo_id']:
                photo_id_str = str(serialized_cycle['photo_id'])
                serialized_cycle['photo_url'] = f"http://localhost:8080/photos/{photo_id_str}"
            else:
                serialized_cycle['photo_url'] = None
            return jsonify(serialized_cycle)
        else:
            return jsonify({"error": "Cycle not found"}), 404
    except Exception as e:
        app.logger.error(f"Error occurred while fetching cycle: {str(e)}")
        return jsonify({"error": "Failed to retrieve cycle", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(port=8080, debug=True)
