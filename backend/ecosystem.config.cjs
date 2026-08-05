module.exports = {
  apps: [
    {
      name: 'fi-fow-api',
      script: 'dist/src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '512M'
    }
  ]
};
