const testModelCreation = async () => {
  try {
    console.log('Creating model with dataset 3...');
    const response = await fetch('http://localhost:5000/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: 1,
        dataset_id: 3,
        name: 'Test Model',
        config: {
          date_column: 'date',
          target_column: 'sales',
          channel_columns: ['tv_spend', 'radio_spend', 'digital_spend', 'print_spend'],
          control_columns: ['temperature', 'holiday']
        }
      })
    });
    
    const result = await response.json();
    console.log('Model creation response:', result);
    
    if (result.id) {
      console.log('Waiting 5 seconds for training...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check model status
      const statusResponse = await fetch(`http://localhost:5000/api/models/${result.id}`);
      const model = await statusResponse.json();
      console.log('Model status:', model.status);
      
      // Get results if completed
      if (model.status === 'completed') {
        const resultsResponse = await fetch(`http://localhost:5000/api/models/${result.id}/results`);
        const results = await resultsResponse.json();
        console.log('Model results:', JSON.stringify(results, null, 2));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testModelCreation();