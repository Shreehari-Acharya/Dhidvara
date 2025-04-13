// debounce.js
// This utility function creates a debounced version of the provided function.
// It delays the execution of the function until after a specified delay period has passed
// since the last time it was invoked. This is useful for optimizing performance
// by preventing the function from being called too frequently, such as during
// window resizing or input events.

export function debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
}