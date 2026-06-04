from flask import Flask, jsonify
from flask_cors import CORS
from api.search_routes import search_api
from api.csp_routes import csp_api
from api.decision_routes import decision_api
from api.uncertainty_routes import uncertainty_api

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(search_api, url_prefix='/api/search')
app.register_blueprint(csp_api, url_prefix='/api/csp')
app.register_blueprint(decision_api, url_prefix='/api/decision')
app.register_blueprint(uncertainty_api, url_prefix='/api/uncertainty')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "AuraCompute Engine"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
