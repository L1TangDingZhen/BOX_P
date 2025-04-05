# box_back/box_back/app/packing_algorithm.py

def place_items(items_data, space_dimensions):
    placed_items = []
    current_x = 0
    
    for index, item in enumerate(items_data):
        order_id = index + 1
        
        dimensions = item['dimensions']
        
        position = {
            'x': current_x,
            'y': 2,
            'z': 2
        }
        
        current_x += dimensions['x']
        
        placed_item = {
            'order_id': order_id,
            'name': item['name'],
            'position': position,
            'dimensions': dimensions,
            'face_up': item.get('face_up', False),
            'fragile': item.get('fragile', False)
        }
        
        placed_items.append(placed_item)
    
    return placed_items