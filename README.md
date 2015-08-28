## Purpose

You have Apache and Nginx-format log files, for private sites without Google Analytics. You'd like to know what the most popular URLs have been lately. You don't want to install a complex log analysis package. You just want a quick report, right now.

## Install

```
npm install -g poptop
```

## Usage

```
tail -50000 /var/log/nginx/mysite.access.log | poptop
```

Out comes a list of URLs sorted by popularity.

That list includes pages not found and other errors. Want to kick those out?

```
tail -50000 /var/log/nginx/mysite.access.log --successful | poptop
```

Want to focus on the "404 not found" errors?

```
tail -50000 /var/log/nginx/mysite.access.log --notfound | poptop
```


Reading the results in terminal? Want the most popular URLs at the bottom? No problem:

```
tail -50000 /var/log/nginx/mysite.access.log | poptop -r
```

That's great, but you don't care about static assets like `.gif`, `.png`, etc. OK, let's ignore them:

```
tail -50000 /var/log/nginx/mysite.access.log | poptop --ignore-static
```

Query strings are showing up as separate accesses. Let's clobber those:

```
tail -50000 /var/log/nginx/mysite.access.log | poptop --ignore-query
```

How about totals for folders?

```
tail -50000 /var/log/nginx/mysite.access.log | poptop --ignore-static --folders
```

Here's a really fancy command line from my actual life:

```
tail -100000 mysite.access.log | node app --ignore-static --ignore-query --successful "--ignore=/admin|svn|/logout|/login" --folders
```

## Search report

After popular pages, the second most common question is "what did people search for?" Use the `--search` option to find out:

```
tail -50000 /var/log/nginx/mysite.access.log | poptop --search=/search,q
```

You'll need to specify the URL where searches happen, and the query string parameter that contains the search string, separated by a comma.

(If your search engine uses POST requests, the search string won't be in the logs, so I can't help you there.)

## Other options

You can also ignore individual file extensions with `--ignore-extensions`. For convenience, `--ignore-static` is equivalent to `--ignore-extensions=gif,jpg,png,js,xlx,pptx,docx,css,ico,pdf`.

And, you can ignore any regular expression you wish with the `--ignore` option. Be sure to quote it to avoid shell issues.

## Credits

`poptop` was created to facilitate our work at [P'unk Avenue](http://punkave.com).

## Changelog

0.1.3: added `woff` and `eot` to `--ignore-static`.

0.1.2: the `--ignore-extensions` option works properly. Also, extensions are still ignored if they are followed by a query string.

