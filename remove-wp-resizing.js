/**
 * WordPress Image Size Suffix Remover
 * 
 * This script removes WordPress-generated image size suffixes from HTML files.
 * It searches for patterns like "-1024x768.jpg" and replaces them with just ".jpg".
 * 
 * Usage: node remove-wp-resizing.js <directory_path> [options]
 * 
 * Options:
 *   --backup <path>    Create backups of modified files in the specified directory
 *   --dry-run          Show what would be changed without modifying files
 *   --help, -h         Show help message
 */

const fs = require('fs');
const path = require('path');

// Function to recursively find all HTML files in a directory
function findHtmlFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          findHtmlFiles(filePath, fileList);
        } else if (path.extname(file).toLowerCase() === '.html') {
          fileList.push(filePath);
        }
      } catch (error) {
        console.error(`Error accessing file/directory ${filePath}:`, error.message);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return fileList;
}

// Function to remove WordPress image size suffixes from HTML content
function removeImageSizeSuffixes(content) {
  // This regex targets WordPress-generated size suffix patterns
  // in URLs for common image formats
  const wpSizePattern = /(-\d+x\d+)(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.svg|\.bmp|\.tiff)/gi;
  
  // Find all matches to report later
  const matches = [];
  let match;
  const regex = new RegExp(wpSizePattern);
  
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      full: match[0],
      replacement: match[2],
      position: match.index
    });
  }
  
  // Replace the size suffix with just the extension
  const newContent = content.replace(wpSizePattern, '$2');
  
  return {
    content: newContent,
    matches: matches
  };
}

// Function to create backup of a file
function createBackup(filePath, backupDir, stats) {
  const relativePath = path.relative(process.cwd(), filePath);
  const backupPath = path.join(backupDir, relativePath);
  const backupDirPath = path.dirname(backupPath);
  
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDirPath)) {
      fs.mkdirSync(backupDirPath, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(filePath, backupPath);
    stats.backups++;
    
    return true;
  } catch (error) {
    console.error(`  Error creating backup for ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to process an HTML file
function processHtmlFile(filePath, options, stats) {
  console.log(`Processing file: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove image size suffixes
    const result = removeImageSizeSuffixes(content);
    
    // If replacements were found
    if (result.matches.length > 0) {
      // Report what was found
      console.log(`  Found ${result.matches.length} image size suffixes to remove:`);
      result.matches.slice(0, 5).forEach((match, i) => {
        console.log(`    ${i+1}. ${match.full} -> ${match.replacement}`);
      });
      
      if (result.matches.length > 5) {
        console.log(`    ... and ${result.matches.length - 5} more`);
      }
      
      // If not dry run, update the file
      if (!options.dryRun) {
        // Create backup if requested
        if (options.backup) {
          if (!createBackup(filePath, options.backup, stats)) {
            console.error(`  Skipping file due to backup failure`);
            stats.errors++;
            return;
          }
        }
        
        // Write the changes
        fs.writeFileSync(filePath, result.content, 'utf8');
        console.log(`  Updated file with ${result.matches.length} replacements`);
      } else {
        console.log(`  Dry run: File would be updated with ${result.matches.length} replacements`);
      }
      
      // Update stats
      stats.modifiedFiles++;
      stats.totalReplacements += result.matches.length;
    } else {
      console.log(`  No changes needed`);
    }
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    stats.errors++;
  }
}

// Function to display help
function showHelp() {
  console.log(`\nWordPress Image Size Suffix Remover`);
  console.log(`===================================`);
  console.log(`\nThis script removes WordPress-generated image size suffixes from HTML files.`);
  console.log(`It searches for patterns like "-1024x768.jpg" and replaces them with just ".jpg".`);
  console.log(`\nUsage: node ${path.basename(__filename)} <directory_path> [options]`);
  console.log(`\nExample: node ${path.basename(__filename)} ./exported-wordpress-site --backup ./backups`);
  console.log(`\nOptions:`);
  console.log(`  --backup <path>    Create backups of modified files in the specified directory`);
  console.log(`  --dry-run          Show what would be changed without modifying files`);
  console.log(`  --help, -h         Show this help message`);
  process.exit(0);
}

// Function to parse command line arguments
function parseArgs() {
  const args = {
    directoryPath: null,
    backup: null,
    dryRun: false
  };
  
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--help' || process.argv[i] === '-h') {
      showHelp();
    } else if (process.argv[i] === '--backup') {
      if (i + 1 < process.argv.length) {
        args.backup = process.argv[++i];
      } else {
        console.error(`\nError: --backup option requires a path argument.`);
        process.exit(1);
      }
    } else if (process.argv[i] === '--dry-run') {
      args.dryRun = true;
    } else if (!args.directoryPath) {
      args.directoryPath = process.argv[i];
    }
  }
  
  return args;
}

// Main function
function main(options) {
  console.log(`\nWordPress Image Size Suffix Remover`);
  console.log(`===================================`);
  console.log(`Scanning directory: ${options.directoryPath}`);
  if (options.backup) {
    console.log(`Backup directory: ${options.backup}`);
  }
  if (options.dryRun) {
    console.log(`Dry run: No files will be modified`);
  }
  console.log('');
  
  try {
    // Stats for logging
    const stats = {
      totalFiles: 0,
      modifiedFiles: 0,
      totalReplacements: 0,
      backups: 0,
      errors: 0
    };
    
    // Create backup directory if it doesn't exist and we're not in dry run mode
    if (options.backup && !options.dryRun && !fs.existsSync(options.backup)) {
      fs.mkdirSync(options.backup, { recursive: true });
    }
    
    // Find all HTML files
    const htmlFiles = findHtmlFiles(options.directoryPath);
    stats.totalFiles = htmlFiles.length;
    console.log(`Found ${htmlFiles.length} HTML files.\n`);
    
    // Process each HTML file
    htmlFiles.forEach(filePath => processHtmlFile(filePath, options, stats));
    
    // Log summary
    console.log(`\nSummary:`);
    console.log(`  Total files scanned: ${stats.totalFiles}`);
    console.log(`  Files with WordPress size suffixes: ${stats.modifiedFiles}`);
    console.log(`  Total suffixes found: ${stats.totalReplacements}`);
    if (options.backup && !options.dryRun) {
      console.log(`  Backup files created: ${stats.backups}`);
    }
    console.log(`  Errors encountered: ${stats.errors}`);
    
    if (options.dryRun) {
      console.log(`\nDry run completed. No files were modified.`);
    } else {
      console.log(`\nProcessing complete!`);
    }
  } catch (error) {
    console.error(`\nError:`, error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const options = parseArgs();

// Check if directory path was provided
if (!options.directoryPath) {
  console.log(`\nError: No directory path provided.`);
  console.log(`\nUsage: node ${path.basename(__filename)} <directory_path> [options]`);
  console.log(`\nUse --help or -h for more information.`);
  process.exit(1);
}

// Verify the directory exists
try {
  const stat = fs.statSync(options.directoryPath);
  if (!stat.isDirectory()) {
    console.error(`\nError: '${options.directoryPath}' is not a directory.`);
    process.exit(1);
  }
} catch (error) {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
}

// Verify the backup directory path is valid
if (options.backup) {
  try {
    if (fs.existsSync(options.backup)) {
      const stat = fs.statSync(options.backup);
      if (!stat.isDirectory()) {
        console.error(`\nError: Backup path '${options.backup}' is not a directory.`);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(`\nError with backup directory: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main(options);