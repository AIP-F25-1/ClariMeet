def calculate_billing(minutes_transcribed: float) -> float:
    """
    Calculate billing based on minutes transcribed.
    
    Args:
        minutes_transcribed: The number of minutes transcribed
        
    Returns:
        The total cost rounded to 2 decimal places
    """
    return round(minutes_transcribed * 0.10, 2)

