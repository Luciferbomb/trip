/**
 * Utility functions for navigation
 */

/**
 * Scrolls the window to the top smoothly
 */
export const scrollToTop = (smooth = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

/**
 * Scrolls to a specific element by ID
 */
export const scrollToElement = (elementId: string, smooth = true) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'start'
    });
  }
}; 