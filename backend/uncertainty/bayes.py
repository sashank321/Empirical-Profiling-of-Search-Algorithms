import time

def build_bayes_step(step_idx, description, formula, value):
    return {
        "step": step_idx,
        "description": description,
        "formula": formula,
        "value": value
    }

def medical_diagnosis(disease_name, prevalence, sensitivity, fpr, test_result):
    steps = []
    step_idx = 1
    
    prior = prevalence
    steps.append(build_bayes_step(step_idx, "Define Prior Probability", "P(Disease)", prior))
    step_idx += 1
    
    if test_result == 'positive':
        likelihood = sensitivity
        steps.append(build_bayes_step(step_idx, "Likelihood of + given Disease", "P(+|Disease) = Sensitivity", likelihood))
        step_idx += 1
        
        false_positive_prob = fpr
        evidence = (prior * likelihood) + ((1 - prior) * false_positive_prob)
        steps.append(build_bayes_step(step_idx, "Calculate Total Evidence for +", "P(+) = P(+|D)P(D) + P(+|~D)P(~D)", evidence))
        step_idx += 1
        
        posterior = (prior * likelihood) / evidence
        steps.append(build_bayes_step(step_idx, "Calculate Posterior (Bayes' Rule)", "P(D|+) = [P(+|D) * P(D)] / P(+)", posterior))
        
    else:
        likelihood = 1 - sensitivity
        steps.append(build_bayes_step(step_idx, "Likelihood of - given Disease", "P(-|Disease) = 1 - Sensitivity", likelihood))
        step_idx += 1
        
        true_negative_prob = 1 - fpr
        evidence = (prior * likelihood) + ((1 - prior) * true_negative_prob)
        steps.append(build_bayes_step(step_idx, "Calculate Total Evidence for -", "P(-) = P(-|D)P(D) + P(-|~D)P(~D)", evidence))
        step_idx += 1
        
        posterior = (prior * likelihood) / evidence
        steps.append(build_bayes_step(step_idx, "Calculate Posterior (Bayes' Rule)", "P(D|-) = [P(-|D) * P(D)] / P(-)", posterior))

    return {
        "prior": prior,
        "likelihood": likelihood,
        "evidence": evidence,
        "posterior": posterior,
        "steps": steps
    }

def sensor_fusion(sensors):
    steps = []
    step_idx = 1
    
    prior_odds = 1.0 
    current_odds = prior_odds
    
    steps.append(build_bayes_step(step_idx, "Initial Prior Odds", "O(E) = P(E)/P(~E)", current_odds))
    step_idx += 1
    
    combined_reading = 0
    total_weight = 0
    
    for s in sensors:
        reading = s.get('reading', 0)
        rel = s.get('reliability', 0.5)
        name = s.get('name', 'Sensor')
        
        likelihood_ratio = (reading * rel + (1 - reading) * (1 - rel)) / ((1 - reading) * rel + reading * (1 - rel))
        
        steps.append(build_bayes_step(step_idx, f"{name} Likelihood Ratio", "LR", likelihood_ratio))
        step_idx += 1
        
        current_odds *= likelihood_ratio
        
        steps.append(build_bayes_step(step_idx, f"Update Odds with {name}", "O(E|S) = O(E) * LR", current_odds))
        step_idx += 1
        
        combined_reading += reading * rel
        total_weight += rel

    final_prob = current_odds / (1 + current_odds)
    steps.append(build_bayes_step(step_idx, "Convert Odds to Probability", "P = O / (1 + O)", final_prob))
    step_idx += 1
    
    combined_reading = combined_reading / total_weight if total_weight > 0 else 0
    
    return {
        "combined": combined_reading,
        "confidence": final_prob,
        "steps": steps
    }
