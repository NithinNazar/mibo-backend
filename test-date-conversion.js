// Test date conversion
const dateString = "1994-03-18";

console.log("Input date string:", dateString);
console.log("Converted to Date:", new Date(dateString));
console.log("ISO String:", new Date(dateString).toISOString());
console.log("Valid date?", !isNaN(new Date(dateString).getTime()));

// Test with different formats
const formats = [
    "1994-03-18",      // YYYY-MM-DD (correct)
    "03/18/1994",      // MM/DD/YYYY (might cause issues)
    "18/03/1994",      // DD/MM/YYYY (might cause issues)
];

console.log("\nTesting different formats:");
formats.forEach(format => {
    const date = new Date(format);
    console.log(`${format} -> ${date.toISOString()} (Valid: ${!isNaN(date.getTime())})`);
});
