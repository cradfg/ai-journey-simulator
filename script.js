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
            }, 1000); 
        }
        
        // Updated Event Listener for INR
        document.getElementById('cartValue').addEventListener('input', (e) => {
            const value = e.target.value;
            // Changed $ to ₹
            document.getElementById('cartValueDisplay').textContent = `₹${Number(value).toLocaleString('en-IN')}`;
            document.getElementById('totalPrice').textContent = `₹${Number(value).toLocaleString('en-IN')}.00`; 
            
            // Logic: Maintaining the 60/40 split for product items
            const price1 = Math.floor(value * 0.6);
            const price2 = value - price1;
            document.getElementById('price1').textContent = price1.toLocaleString('en-IN');
            document.getElementById('price2').textContent = price2.toLocaleString('en-IN');
            
            triggerPredictionWithDelay();
        });
        
        document.getElementById('device').addEventListener('change', () => { getPrediction(); });
        document.getElementById('trafficSource').addEventListener('change', () => { getPrediction(); });
        document.getElementById('hesitation').addEventListener('change', () => { getPrediction(); });

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

                // Helper for Indian Currency Formatting
                const formatINR = (num) => `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                // Update stats cards
                document.getElementById('conversionProb').textContent = `${(bestData.conversion_probability * 100).toFixed(1)}%`;
                document.getElementById('expectedValue').textContent = formatINR(bestData.expected_value);
                document.getElementById('interventionCost').textContent = formatINR(bestData.cost);

                // Update total amount based on intervention
                const totalElement = document.getElementById('totalPrice');
                if (bestData.intervention_type === 'discount_5') {
                    const discounted = cartValue * 0.95;
                    totalElement.innerHTML = `<s style="opacity: 0.5; font-size: 0.9em;">₹${cartValue.toLocaleString('en-IN')}</s> ₹${discounted.toLocaleString('en-IN')}`;
                } else if (bestData.intervention_type === 'discount_10') {
                    const discounted = cartValue * 0.90;
                    totalElement.innerHTML = `<s style="opacity: 0.5; font-size: 0.9em;">₹${cartValue.toLocaleString('en-IN')}</s> ₹${discounted.toLocaleString('en-IN')}`;
                } else if (bestData.intervention_type === 'free_shipping') {
                    totalElement.innerHTML = `₹${cartValue.toLocaleString('en-IN')} <span style="font-size: 0.7em; color: #22c55e; font-weight: 600;">-FREE SHIPPING</span>`;
                } else {
                    totalElement.textContent = `₹${cartValue.toLocaleString('en-IN')}.00`;
                }

                // Show intervention banner
                if (bestData.intervention_type !== 'none') {
                    const banner = document.getElementById('interventionBanner');
                    banner.textContent = bestData.message;
                    banner.className = 'intervention-banner show';
                } else {
                    document.getElementById('interventionBanner').className = 'intervention-banner';
                }

                // Display predictions with ₹
                const best = bestData.intervention_type;
                predictionsDiv.innerHTML = allData.interventions.map(pred => {
                    const isBest = pred.intervention_type === best;
                    const convPct = (pred.conversion_probability * 100).toFixed(1);
                    
                    return `
                        <div class="prediction-item ${isBest ? 'best' : ''}">
                            <div class="prediction-header">
                                <div class="prediction-name">${pred.intervention_type.replace('_', ' ')}</div>
                                <div class="prediction-ev">₹${pred.expected_value.toLocaleString('en-IN')}</div>
                            </div>
                            <div class="prediction-metrics">
                                <div class="metric">
                                    <div class="metric-label">Conversion</div>
                                    <div class="metric-value">${convPct}%</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-label">Cost</div>
                                    <div class="metric-value">₹${pred.cost.toLocaleString('en-IN')}</div>
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
        
        setTimeout(() => {
            getPrediction();
        }, 1000);