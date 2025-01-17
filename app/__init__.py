from flask import Flask

def create_app():
    app = Flask(__name__)

    from app.routes.index import Index
    app.register_blueprint(Index)
    
    return app
