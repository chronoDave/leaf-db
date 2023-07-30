const { performance, PerformanceObserver } = require('perf_hooks');

module.exports = (name, cb, n = 10) => {
  const perfObserver = new PerformanceObserver(items => {
    items
      .getEntries()
      .forEach(entry => console.log(`${entry.name}: ${(entry.duration / n).toFixed(2)}ms`));
  });
  perfObserver.observe({ entryTypes: ['measure'], buffered: true });

  performance.mark('start');
  for (let i = 0; i < n; i += 1) cb();
  performance.mark('end');

  performance.measure(name, 'start', 'end');
};
