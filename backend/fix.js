const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(path.join(__dirname, 'src'), function (filePath) {
    if (filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content.replace(/['"]@types\/index['"]/g, "'@appTypes/index'");

        // Also fix the req.params -> string cast in controllers
        if (filePath.includes('postController')) {
            newContent = newContent.replace(/const { id } = req\.params;/g, 'const id = req.params.id as string;');
        }
        if (filePath.includes('userController')) {
            newContent = newContent.replace(/const { id } = req\.params;/g, 'const id = req.params.id as string;');
        }
        if (filePath.includes('voteController')) {
            newContent = newContent.replace(/const { postId } = req\.params;/g, 'const postId = req.params.postId as string;');
        }

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log('Fixed', filePath);
        }
    }
});
