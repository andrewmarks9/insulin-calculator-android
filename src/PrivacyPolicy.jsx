import React from 'react';

export function PrivacyPolicy({ onClose }) {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Privacy Policy</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p><strong>Last Updated: December 2025</strong></p>

                    <h3>1. Data Collection and Usage</h3>
                    <p>
                        The Insulin Calculator app is designed with your privacy in mind.
                        <strong> We do not collect, store, or transmit any of your personal health data to external servers.</strong>
                    </p>

                    <h3>2. Local Storage</h3>
                    <p>
                        All data entered into the application, including blood glucose readings, carbohydrate inputs, and insulin ratios, is stored locally on your device using your device's internal storage mechanisms.
                    </p>

                    <h3>3. PDF Export</h3>
                    <p>
                        When you export your history as a PDF, the file is generated locally on your device. You have full control over how and where this file is shared.
                    </p>

                    <h3>4. Contact Us</h3>
                    <p>
                        If you have any questions about this privacy policy, please contact us at support@example.com (Replace with real email).
                    </p>
                </div>
                <div className="modal-footer">
                    <button className="primary-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
