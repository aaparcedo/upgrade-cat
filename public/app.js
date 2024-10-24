document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    const imageInput = document.getElementById('imageInput');
    const originalPreview = document.querySelector('#originalPreview .image-preview');
    const transformedPreview = document.querySelector('#transformedPreview .image-preview');
    const status = document.getElementById('status');

    async function pollPrediction(predictionId) {
        try {
            const response = await fetch(`/api/check-prediction/${predictionId}`);
            if (!response.ok) throw new Error('Polling failed');
            
            const prediction = await response.json();
            
            if (prediction.status === 'succeeded') {
                return prediction.output;
            } else if (prediction.status === 'failed') {
                throw new Error('Image generation failed');
            } else {
                // If still processing, wait 1 second and try again
                await new Promise(resolve => setTimeout(resolve, 1000));
                return await pollPrediction(predictionId);
            }
        } catch (error) {
            console.error('Polling error:', error);
            throw error;
        }
    }

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                originalPreview.innerHTML = '';
                originalPreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = imageInput.files[0];
        
        if (!file) {
            status.textContent = 'Please select an image first';
            return;
        }

        try {
            status.textContent = 'Starting transformation...';
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageUri = e.target.result;
                
                try {
                    const response = await fetch('/api/transform', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            image: imageUri
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const prediction = await response.json();
                    console.log('Initial API Response:', prediction);
                    
                    if (prediction.id) {
                        status.textContent = 'Processing image...';
                        const outputUrl = await pollPrediction(prediction.id);
                        
                        if (outputUrl) {
                            const img = document.createElement('img');
                            img.src = outputUrl;
                            transformedPreview.innerHTML = '';
                            transformedPreview.appendChild(img);
                            status.textContent = 'Transformation complete!';
                        } else {
                            throw new Error('No output URL received');
                        }
                    } else {
                        throw new Error('No prediction ID received');
                    }

                } catch (error) {
                    console.error('Error:', error);
                    status.textContent = `Error: ${error.message}`;
                }
            };

            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Error:', error);
            status.textContent = `Error: ${error.message}`;
        }
    });
});