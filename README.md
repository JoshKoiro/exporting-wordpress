# exporting-wordpress
Some notes about exporting a wordpress site as a static site and the issues I ran into

## Simply Static Plugin

Once you are ready to export your site, install the simply static plugin for wordpress.

Make sure you have all of the URLs to each page as you are able to access them in your wordpress instance listed in the additional URLs section of the general settings.

Make sure to include the /wp-content/uploads directory in the additional files and directories. Also copy the home path using the button below the additional files and directories field to paste the prefix location of where the /wp-content is stored.

Feel free to add any other files or URLs if there are issues. Can't hurt to add any if Simply Static doesn't pick them up.

## Downloading Media

Make sure to also download the Export Media Library plugin (https://github.com/massedge/wordpress-plugin-export-media-library). This will allow you to download the entire contents of your images after the simply static export.

## The Problem

The problem I was having was that the images of the website had one of two problems:

1. The files were not downloaded with the Simply Static plugin (even when they were in the /wp-content location). This has something to do with the fact that if the images aren't being properly loaded into the DOM of the worddpress site, it won't list them to be downloaded for the static site. (like in the case of a background-image css property)

2. The other issue I ran into was Wordpress trying to optimize site performace by creating different image urls with different sizes. (image-name-1024x768.jpg and image-name-600x400.jpg etc.) I tried to stop this from happening by modifying the functions.php file of the wordpress theme, but this didn't fix the problem.

## The Solution

In order to fix this, I have written the following script to automatically remove any image size suffix from the html files.

[remove-wp-resizing.js](remove-wp-resizing.js)

Run this against the main directory (after unzipping) and it will go through all the html files and modify the urls to not include the size suffix.

you may read more about the script by running 
```
node remove-wp-resizing.js --help`
```