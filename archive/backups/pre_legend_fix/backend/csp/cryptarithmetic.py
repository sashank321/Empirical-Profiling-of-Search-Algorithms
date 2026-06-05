"""Cryptarithmetic Problem Generator for CSP.

Solves logic puzzles like:
  S E N D
+ M O R E
---------
M O N E Y

Each letter must represent a unique digit (0-9).
Leading letters cannot be 0.

Author: CORTEX AI Engine
"""

from typing import Any, Dict, List, Set, Tuple


def create_cryptarithmetic(
    word1: str = "SEND",
    word2: str = "MORE",
    result_word: str = "MONEY"
) -> Dict[str, Any]:
    """Generate a CSP setup for a cryptarithmetic puzzle.

    Args:
        word1: First word (addend)
        word2: Second word (addend)
        result_word: Result word (sum)

    Returns:
        Dictionary with variables, domains, and is_consistent function
    """
    # Extract unique letters
    letters: Set[str] = set(word1 + word2 + result_word)
    variables = list(letters)
    
    # Define domains (0-9 for most, 1-9 for leading letters)
    leading_letters = {word1[0], word2[0], result_word[0]}
    domains: Dict[str, List[int]] = {}
    
    for letter in variables:
        if letter in leading_letters:
            domains[letter] = list(range(1, 10))
        else:
            domains[letter] = list(range(10))
            
    # Pre-calculate column structure for efficient checking
    max_len = max(len(word1), len(word2), len(result_word))
    w1_pad = word1.zfill(max_len)
    w2_pad = word2.zfill(max_len)
    res_pad = result_word.zfill(max_len)
    
    columns = []
    for i in range(max_len - 1, -1, -1):
        c1 = w1_pad[i] if w1_pad[i] != '0' else None
        c2 = w2_pad[i] if w2_pad[i] != '0' else None
        c3 = res_pad[i] if res_pad[i] != '0' else None
        columns.append((c1, c2, c3))

    def is_consistent(assignment: Dict[str, int]) -> bool:
        """Check if current assignment is consistent."""
        # Alldiff constraint (no two letters share a digit)
        if len(set(assignment.values())) != len(assignment):
            return False
            
        # Mathematical constraint (column by column from right to left)
        carry = 0
        
        for c1, c2, c3 in columns:
            # If all letters in this column are assigned
            if (c1 is None or c1 in assignment) and \
               (c2 is None or c2 in assignment) and \
               (c3 is None or c3 in assignment):
                
                v1 = assignment[c1] if c1 else 0
                v2 = assignment[c2] if c2 else 0
                v3 = assignment[c3] if c3 else 0
                
                total = v1 + v2 + carry
                
                # The sum mod 10 must equal the result letter
                if total % 10 != v3:
                    return False
                    
                # Calculate carry for next column
                carry = total // 10
            else:
                # If column is incomplete, we can't definitively check math yet,
                # but we can do a bounds check.
                # Max possible sum is 9 + 9 + 1 (carry) = 19
                # If we know the result digit but not the addends, we can't rule it out.
                # For simplicity, we just say it's consistent until fully assigned.
                pass
                
        # Final carry check (if all columns processed)
        if len(assignment) == len(variables):
            if carry != 0:
                return False
                
        return True

    return {
        'variables': variables,
        'domains': domains,
        'is_consistent': is_consistent,
        'type': 'cryptarithmetic',
        'word1': word1,
        'word2': word2,
        'result_word': result_word
    }
