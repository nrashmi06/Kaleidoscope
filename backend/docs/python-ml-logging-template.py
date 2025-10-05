# Python logging configuration for ML microservice
# Compatible with Kaleidoscope ELK stack logging pipeline

import logging
import json
import sys
from datetime import datetime
from typing import Optional
import uuid
import os
import socket

class CorrelationIdFilter(logging.Filter):
    """Filter to add correlation ID to log records"""

    def __init__(self):
        super().__init__()
        self.correlation_id = None

    def set_correlation_id(self, correlation_id: str):
        """Set correlation ID for current request"""
        self.correlation_id = correlation_id

    def filter(self, record):
        record.correlation_id = self.correlation_id or str(uuid.uuid4())
        return True

class RequestContextFilter(logging.Filter):
    """Filter to add request context (MDC) fields to log records"""
    def __init__(self):
        super().__init__()
        self.context = {}

    def set_context(self, **kwargs):
        self.context = kwargs

    def clear_context(self):
        self.context = {}

    def filter(self, record):
        for k, v in self.context.items():
            setattr(record, k, v)
        return True

class JSONFormatter(logging.Formatter):
    """JSON formatter compatible with Logstash pipeline"""

    def format(self, record):
        log_entry = {
            '@timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'service': 'kaleidoscope-ml-service',
            'environment': os.getenv('ENVIRONMENT', 'development'),
            'application': 'kaleidoscope',
            'thread': getattr(record, 'thread', None),
            'mdc': {
                'correlationId': getattr(record, 'correlation_id', None),
                'requestMethod': getattr(record, 'request_method', None),
                'requestUri': getattr(record, 'request_uri', None),
                'responseStatus': getattr(record, 'response_status', None),
                'responseTimeMs': getattr(record, 'response_time_ms', None),
                'clientIp': getattr(record, 'client_ip', None),
                'userAgent': getattr(record, 'user_agent', None)
            }
        }

        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_entry, default=str)

def setup_logging(logstash_host: str = "localhost", logstash_port: int = 5001):
    """
    Setup structured logging for ML service
    Returns: (logger, correlation_filter)
    """

    correlation_filter = CorrelationIdFilter()
    request_context_filter = RequestContextFilter()
    logger = logging.getLogger("kaleidoscope-ml-service")
    logger.setLevel(logging.DEBUG if os.getenv('DEBUG') == 'true' else logging.INFO)
    logger.handlers.clear()

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JSONFormatter())
    console_handler.addFilter(correlation_filter)
    console_handler.addFilter(request_context_filter)
    logger.addHandler(console_handler)

    # TCP handler for Logstash
    try:
        import logging.handlers
        logstash_handler = logging.handlers.SocketHandler(logstash_host, logstash_port)
        logstash_handler.setFormatter(JSONFormatter())
        logstash_handler.addFilter(correlation_filter)
        logstash_handler.addFilter(request_context_filter)
        logger.addHandler(logstash_handler)
        logger.info(f"Connected to Logstash at {logstash_host}:{logstash_port}")
    except Exception as e:
        logger.warning(f"Could not connect to Logstash: {e}")

    return logger, correlation_filter

# Example usage:
"""
from logging_config import setup_logging

# Initialize logging
logger, correlation_filter = setup_logging()

# In your Flask/FastAPI request handler:
def process_ml_request(correlation_id: str = None):
    if correlation_id:
        correlation_filter.set_correlation_id(correlation_id)

    logger.info("Processing ML request", extra={
        "model_version": "v1.0.0",
        "input_size": 1024
    })

    # Your ML processing logic here

    logger.info("ML processing completed", extra={
        "processing_time_ms": 150,
        "confidence_score": 0.95
    })

# To set correlation ID and request context per request:
# correlation_filter.set_correlation_id('your-correlation-id')
# request_context_filter.set_context(
#     request_method='POST',
#     request_uri='/api/ml/predict',
#     response_status=200,
#     response_time_ms=123,
#     client_ip='203.0.113.1',
#     user_agent='Mozilla/5.0 ...'
# )
# logger.info('Prediction completed')
# request_context_filter.clear_context()
"""
