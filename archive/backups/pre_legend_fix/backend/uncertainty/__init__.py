"""Probabilistic reasoning and Bayesian inference.

Implements:
- Bayes' Theorem for medical diagnosis
- Sensor fusion using likelihood ratios
- Bayesian network variable elimination
"""
from .bayes import medical_diagnosis, sensor_fusion

__all__ = ['medical_diagnosis', 'sensor_fusion']
