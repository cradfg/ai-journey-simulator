
        const API_URL = 'http://localhost:8000';
        
        async function checkConnection() {
            try {
                const response = await fetch(`${API_URL}/health`);
                if (response.ok) {
                    document.getElementById('status').innerHTML = '<span class="status-dot"></span> ML Service Connected';
                    document.getElementById('status').className = 'status connected';
                } else {
                    throw new Error('Service not responding');
                }
            } catch (error) {
                document.getElementById('status').innerHTML = '<span class="status-dot"></span> ML Service Offline';
                document.getElementById('status').className = 'status error';
            }
        }

        let predictionTimeout;
        
        function triggerPredictionWithDelay() {
            clearTimeout(predictionTimeout);
            predictionTimeout = setTimeout(() => {
                getPrediction();
            }, 1000); // Wait 1000ms after user stops changing values
        }
        
        document.getElementById('cartValue').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('cartValueDisplay').textContent = `$${value}`;
            document.getElementById('totalPrice').textContent = `$${value}.00`; // Reset to base price
            
            const price1 = Math.floor(value * 0.6);
            const price2 = value - price1;
            document.getElementById('price1').textContent = price1;
            document.getElementById('price2').textContent = price2;
            
            triggerPredictionWithDelay();
        });
        
        // Auto-trigger on device change
        document.getElementById('device').addEventListener('change', () => {
            getPrediction();
        });
        
        // Auto-trigger on traffic source change
        document.getElementById('trafficSource').addEventListener('change', () => {
            getPrediction();
        });
        
        // Auto-trigger on hesitation change
        document.getElementById('hesitation').addEventListener('change', () => {
            getPrediction();
        });

        async function getPrediction() {
            const cartValue = parseFloat(document.getElementById('cartValue').value);
            const device = document.getElementById('device').value;
            const trafficSource = document.getElementById('trafficSource').value;
            const checkoutPageViews = parseInt(document.getElementById('hesitation').value);

            const request = {
                cart_value: cartValue,
                device: device,
                traffic_source: trafficSource,
                checkout_page_views: checkoutPageViews,
                time_spent: checkoutPageViews * 30,
                previous_purchases: 3,
                pages_viewed: 8,
                product_views: 5,
                search_count: 2,
                cart_additions: 2,
                wishlist_additions: 1
            };

            // Show loading state
            const predictionsDiv = document.getElementById('allPredictions');
            const originalContent = predictionsDiv.innerHTML;
            
            try {
                const [allResponse, bestResponse] = await Promise.all([
                    fetch(`${API_URL}/predict-all`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(request)
                    }),
                    fetch(`${API_URL}/predict-intervention`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(request)
                    })
                ]);

                const allData = await allResponse.json();
                const bestData = await bestResponse.json();

                // Update stats
                document.getElementById('conversionProb').textContent = `${(bestData.conversion_probability * 100).toFixed(1)}%`;
                document.getElementById('expectedValue').textContent = `$${bestData.expected_value.toFixed(2)}`;
                document.getElementById('interventionCost').textContent = `$${bestData.cost.toFixed(2)}`;

                // Update total amount based on intervention
                const totalElement = document.getElementById('totalPrice');
                if (bestData.intervention_type === 'discount_5') {
                    const discounted = cartValue * 0.95;
                    totalElement.innerHTML = `<s style="opacity: 0.5; font-size: 0.9em;">$${cartValue.toFixed(2)}</s> $${discounted.toFixed(2)}`;
                } else if (bestData.intervention_type === 'discount_10') {
                    const discounted = cartValue * 0.90;
                    totalElement.innerHTML = `<s style="opacity: 0.5; font-size: 0.9em;">$${cartValue.toFixed(2)}</s> $${discounted.toFixed(2)}`;
                } else if (bestData.intervention_type === 'free_shipping') {
                    totalElement.innerHTML = `$${cartValue.toFixed(2)} <span style="font-size: 0.7em; color: #22c55e; font-weight: 600;">-SHIPPING CHARGES</span>`;
                } else {
                    totalElement.textContent = `$${cartValue.toFixed(2)}`;
                }

                // Show intervention banner
                if (bestData.intervention_type !== 'none') {
                    const banner = document.getElementById('interventionBanner');
                    banner.textContent = bestData.message;
                    banner.className = 'intervention-banner show';
                } else {
                    document.getElementById('interventionBanner').className = 'intervention-banner';
                }

                // Display predictions with new design
                const best = bestData.intervention_type;
                
                predictionsDiv.innerHTML = allData.interventions.map(pred => {
                    const isBest = pred.intervention_type === best;
                    const convPct = (pred.conversion_probability * 100).toFixed(1);
                    
                    return `
                        <div class="prediction-item ${isBest ? 'best' : ''}">
                            <div class="prediction-header">
                                <div class="prediction-name">${pred.intervention_type.replace('_', ' ')}</div>
                                <div class="prediction-ev">$${pred.expected_value.toFixed(2)}</div>
                            </div>
                            <div class="prediction-metrics">
                                <div class="metric">
                                    <div class="metric-label">Conversion</div>
                                    <div class="metric-value">${convPct}%</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-label">Cost</div>
                                    <div class="metric-value">$${pred.cost.toFixed(2)}</div>
                                </div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${convPct}%"></div>
                            </div>
                        </div>
                    `;
                }).join('');

            } catch (error) {
                console.error('Prediction error:', error);
                predictionsDiv.innerHTML = originalContent;
            }
        }

        function triggerCheckout() {
            alert('🎉 Order completed! (Demo only)');
        }

        checkConnection();
        setInterval(checkConnection, 5000);
        
        // Run initial prediction after 1 second (let ML service connect first)
        setTimeout(() => {
            getPrediction();
        }, 1000);