import { validateEmail, validatePhone, validateRequired, validateFormData } from './formValidation';

// Test cases from the brief

console.log('=== Test Suite: Form Validation ===\n');

// Test 1: Valid form (all required fields correct)
console.log('Test 1: Valid form (all required fields correct)');
const validFormResult = validateFormData({
  fullName: 'John Doe',
  phone: '+58 (412) 555-1234',
  email: 'john@example.com',
  businessType: 'restaurant',
  companyName: 'My Restaurant',
  message: 'Interested in bulk orders',
});
console.log('Expected: valid: true, errors: []');
console.log('Actual:', JSON.stringify(validFormResult, null, 2));
console.log('PASS:', validFormResult.valid === true && validFormResult.errors.length === 0 ? '✓' : '✗');
console.log();

// Test 2: Invalid email
console.log('Test 2: Invalid email');
const invalidEmailResult = validateFormData({
  fullName: 'John Doe',
  phone: '+58 (412) 555-1234',
  email: 'notanemail',
  businessType: 'restaurant',
});
console.log('Expected: error on email field');
console.log('Actual:', JSON.stringify(invalidEmailResult, null, 2));
const hasEmailError = invalidEmailResult.errors.some(e => e.field === 'email');
console.log('PASS:', hasEmailError ? '✓' : '✗');
console.log();

// Test 3: Invalid phone (too short)
console.log('Test 3: Invalid phone (too short)');
const invalidPhoneResult = validateFormData({
  fullName: 'John Doe',
  phone: '+1234',
  email: 'john@example.com',
  businessType: 'restaurant',
});
console.log('Expected: error on phone field');
console.log('Actual:', JSON.stringify(invalidPhoneResult, null, 2));
const hasPhoneError = invalidPhoneResult.errors.some(e => e.field === 'phone');
console.log('PASS:', hasPhoneError ? '✓' : '✗');
console.log();

// Test 4: Empty required fields
console.log('Test 4: Empty required fields');
const emptyFormResult = validateFormData({
  fullName: '',
  phone: '',
  email: '',
  businessType: '',
});
console.log('Expected: errors on each empty required field');
console.log('Actual:', JSON.stringify(emptyFormResult, null, 2));
const requiredFields = ['fullName', 'phone', 'email', 'businessType'];
const allFieldsHaveErrors = requiredFields.every(field =>
  emptyFormResult.errors.some(e => e.field === field)
);
console.log('PASS:', allFieldsHaveErrors ? '✓' : '✗');
console.log();

// Test 5: Optional fields empty
console.log('Test 5: Optional fields empty (no errors)');
const optionalEmptyResult = validateFormData({
  fullName: 'John Doe',
  phone: '+58 (412) 555-1234',
  email: 'john@example.com',
  businessType: 'restaurant',
  companyName: '',
  message: '',
});
console.log('Expected: valid: true, errors: []');
console.log('Actual:', JSON.stringify(optionalEmptyResult, null, 2));
console.log('PASS:', optionalEmptyResult.valid === true && optionalEmptyResult.errors.length === 0 ? '✓' : '✗');
console.log();

// Test 6: Name too short
console.log('Test 6: Name too short (< 3 characters)');
const shortNameResult = validateFormData({
  fullName: 'Jo',
  phone: '+58 (412) 555-1234',
  email: 'john@example.com',
  businessType: 'restaurant',
});
console.log('Expected: error on fullName field');
console.log('Actual:', JSON.stringify(shortNameResult, null, 2));
const hasNameError = shortNameResult.errors.some(e => e.field === 'fullName');
console.log('PASS:', hasNameError ? '✓' : '✗');
console.log();

// Test 7: Valid phone formats
console.log('Test 7: Valid phone formats');
const validPhones = [
  '+58 (412) 555-1234',
  '+1-555-1234567',
  '5551234567',
  '+58(412)5551234',
];
validPhones.forEach(phone => {
  const result = validatePhone(phone);
  console.log(`  "${phone}": ${result ? '✓' : '✗'}`);
});
console.log();

// Test 8: Email validation
console.log('Test 8: Email validation');
const emailTests = [
  { email: 'valid@example.com', expected: true },
  { email: 'user.name+tag@example.co.uk', expected: true },
  { email: 'invalid@', expected: false },
  { email: 'invalid@.com', expected: false },
  { email: 'no-at-sign.com', expected: false },
];
emailTests.forEach(test => {
  const result = validateEmail(test.email);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`  "${test.email}" (expected ${test.expected}): ${status}`);
});
console.log();

console.log('=== Test Suite Complete ===');
