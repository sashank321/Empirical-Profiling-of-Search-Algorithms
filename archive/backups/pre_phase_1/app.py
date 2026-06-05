import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS

# Ensure backend directory is in the path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from api.search_routes import search_bp

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Enable CORS for Next.js frontend (default dev port 3000)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    app.register_blueprint(search_bp, url_prefix='/api/search')
    
    @app.route('/api/health')
    def health_check():
        """Health check endpoint for the Next.js fallback mechanism."""
        return jsonify({
            'status': 'ok',
            'service': 'CORTEX AI Python Engine',
            'version': '1.0.0'
        })
        
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify(error=str(e.description)), 400
        
    @app.errorhandler(500)
    def server_error(e):
        return jsonify(error="Internal server error occurred."), 500

    return app

if __name__ == '__main__':
    app = create_app()
    # Run on port 5000 as expected by Next.js fallback
    app.run(host='0.0.0.0', port=5000, debug=True)
