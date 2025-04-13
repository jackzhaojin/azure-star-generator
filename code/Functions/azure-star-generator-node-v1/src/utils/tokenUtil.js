/**
 * Utility functions for token estimation and handling
 */

/**
 * Estimate token count for a text string
 * Note: This is a simple approximation. For production use,
 * consider a more accurate tokenizer like GPT Tokenizer
 * 
 * @param {string} text - The text to estimate tokens for
 * @returns {number} - Estimated token count
 */
function estimateTokenCount(text) {
    // Approximation: 1 token is roughly 4 characters in English text
    return Math.ceil(text.length / 4);
}

module.exports = {
    estimateTokenCount
};