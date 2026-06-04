from flask import Blueprint, request, jsonify
from uncertainty.bayes import medical_diagnosis, sensor_fusion

uncertainty_api = Blueprint('uncertainty_api', __name__)

@uncertainty_api.route('/execute', methods=['POST'])
def execute_bayes():
    data = request.json
    mode = data.get('mode')
    
    if mode == 'medical':
        prevalence = data.get('prevalence', 0.01)
        sensitivity = data.get('sensitivity', 0.95)
        fpr = data.get('fpr', 0.05)
        test_result = data.get('testResult', 'positive')
        result = medical_diagnosis("Disease X", prevalence, sensitivity, fpr, test_result)
        return jsonify(result)
        
    elif mode == 'sensor':
        sensors = data.get('sensors', [])
        result = sensor_fusion(sensors)
        return jsonify(result)
        
    return jsonify({"error": "Invalid mode"}), 400
