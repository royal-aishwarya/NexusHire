"""Shared Flask extensions.

Keeping extension instances outside app.py avoids circular imports from route
modules back into the application factory/module.
"""
from flask_pymongo import PyMongo

mongo = PyMongo()
