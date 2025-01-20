const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../movies.json');

function saveMovies(movies) {
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2), 'utf-8');
};

module.exports = saveMovies;