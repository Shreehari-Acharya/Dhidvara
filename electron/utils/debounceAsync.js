export function debounceAsync(fn, delay) {
    let timer = null;
    let lastArgs;
    let promise = null;
  
    return function(...args) {
      lastArgs = args;
  
      if (timer) clearTimeout(timer);
  
      return new Promise((resolve) => {
        timer = setTimeout(async () => {
          promise = fn(...lastArgs);
          const result = await promise;
          resolve(result);
        }, delay);
      });
    };
  }