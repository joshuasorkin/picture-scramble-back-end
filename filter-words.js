import fs from 'fs'

// Read the contents of wordlist.txt
fs.readFile('wordlist.txt', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // Split the contents into an array of words
    const words = data.split('\n');

    // Filter the words to include only those with 4 or more characters
    const filteredWords = words.filter(word => word.length >= 4);

    // Join the filtered words back into a string
    const output = filteredWords.join('\n');

    // Write the string to wordlist4plus.txt
    fs.writeFile('wordlist4plus.txt', output, err => {
        if (err) {
            console.error('Error writing file:', err);
        } else {
            console.log('File saved: wordlist4plus.txt');
        }
    });
});