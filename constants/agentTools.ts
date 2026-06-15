export const agentTools = [
  {
    type: 'function',
    name: 'log_water',
    description: 'Logs water intake for the user.',
    parameters: {
      type: 'object',
      properties: {
        amount_ml: { type: 'number', description: 'Amount of water in milliliters.' },
      },
      required: ['amount_ml'],
    },
  },
  {
    type: 'function',
    name: 'log_sleep',
    description: 'Logs the user\'s sleep duration and optionally quality.',
    parameters: {
      type: 'object',
      properties: {
        hours: { type: 'number', description: 'Number of hours slept.' },
        quality: { type: 'string', enum: ['poor', 'fair', 'good', 'excellent'], description: 'Quality of sleep.' },
      },
      required: ['hours'],
    },
  },
  {
    type: 'function',
    name: 'create_habit',
    description: 'Creates a new habit for the user.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name of the habit (e.g. Meditate, Read).' },
        frequency: { type: 'string', enum: ['daily', 'weekly'], description: 'How often the habit should be performed.' },
      },
      required: ['name', 'frequency'],
    },
  },
  {
    type: 'function',
    name: 'complete_habit',
    description: 'Marks a habit as completed for today.',
    parameters: {
      type: 'object',
      properties: {
        habit_name: { type: 'string', description: 'The name or ID of the habit to complete.' },
      },
      required: ['habit_name'],
    },
  },
  {
    type: 'function',
    name: 'get_health_summary',
    description: 'Retrieves the user\'s recent health data (hydration, sleep, habits) to answer "how am I doing" questions.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];
