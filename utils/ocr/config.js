module.exports = {
  // RC Document field patterns
  rcPatterns: {
    registrationNumber: /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/,
    engineNumber: /^[A-Z0-9]{6,17}$/,
    chassisNumber: /^[A-Z0-9]{17}$/
  },
  
  // Required fields for RC verification
  requiredFields: [
    'registrationNumber',
    'ownerName',
    'vehicleClass',
    'maker',
    'engineNumber',
    'chassisNumber'
  ],

  // State codes mapping
  stateCodes: {
    'AN': 'Andaman and Nicobar Islands',
    'AP': 'Andhra Pradesh',
    'AR': 'Arunachal Pradesh',
    'AS': 'Assam',
    'BR': 'Bihar',
    'CH': 'Chandigarh',
    'CT': 'Chhattisgarh',
    'DN': 'Dadra and Nagar Haveli',
    'DD': 'Daman and Diu',
    'DL': 'Delhi',
    'GA': 'Goa',
    'GJ': 'Gujarat',
    'HR': 'Haryana',
    'HP': 'Himachal Pradesh',
    'JK': 'Jammu and Kashmir',
    'JH': 'Jharkhand',
    'KA': 'Karnataka',
    'KL': 'Kerala',
    'LA': 'Ladakh',
    'LD': 'Lakshadweep',
    'MP': 'Madhya Pradesh',
    'MH': 'Maharashtra',
    'MN': 'Manipur',
    'ML': 'Meghalaya',
    'MZ': 'Mizoram',
    'NL': 'Nagaland',
    'OD': 'Odisha',
    'PY': 'Puducherry',
    'PB': 'Punjab',
    'RJ': 'Rajasthan',
    'SK': 'Sikkim',
    'TN': 'Tamil Nadu',
    'TS': 'Telangana',
    'TR': 'Tripura',
    'UP': 'Uttar Pradesh',
    'UK': 'Uttarakhand',
    'WB': 'West Bengal'
  }
};
