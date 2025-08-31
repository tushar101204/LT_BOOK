/**
 * Convert ISO time string to minutes since midnight UTC
 * @param {string} isoStr - ISO string like "2000-01-01T09:00:00.000Z"
 * @returns {number} Minutes since midnight UTC
 */
const isoToMinutesSinceMidnightUTC = (isoStr) => {
  const date = new Date(isoStr);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
};

/**
 * Get slot numbers covering the time range [startIso, endIso)
 * @param {string} startIso - Start time ISO string
 * @param {string} endIso - End time ISO string (exclusive)
 * @param {number} slotMinutes - Duration of each slot in minutes (default: 15)
 * @returns {Array<number>} Array of slot indices
 */
const getSlotNumbersFromISOs = (startIso, endIso, slotMinutes = 15) => {
  const startMinutes = isoToMinutesSinceMidnightUTC(startIso);
  const endMinutes = isoToMinutesSinceMidnightUTC(endIso);
  
  if (startMinutes >= endMinutes) {
    return []; // Invalid time range
  }
  
  const slots = [];
  for (let slot = Math.floor(startMinutes / slotMinutes); 
       slot < Math.ceil(endMinutes / slotMinutes); 
       slot++) {
    slots.push(slot);
  }
  
  return slots;
};

/**
 * Convert date to YYYY-MM-DD string using UTC
 * @param {Date|string} dateVal - Date value to normalize
 * @returns {string} Date in YYYY-MM-DD format
 */
const toDateStringYYYYMMDD = (dateVal) => {
  const date = new Date(dateVal);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

module.exports = {
  isoToMinutesSinceMidnightUTC,
  getSlotNumbersFromISOs,
  toDateStringYYYYMMDD
};
