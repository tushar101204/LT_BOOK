import React from 'react'
import React, { useState, useEffect } from 'react';

const AvailableLTs = ({ availableLTs }) => {
  if (!availableLTs || availableLTs.length === 0) {
    return <p>No LTs available for the selected date and time</p>;
  }

  return (
    <div>
      <h2>Available Lecture Theatres</h2>
      <ul>
        {availableLTs.map((lt, index) => (
          <li key={index}>
            <strong>{lt.name}</strong> - Capacity: {lt.capacity} {/* Assuming the Hall model has name and capacity */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AvailableLTs;
