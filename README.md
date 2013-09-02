# Flags!

You need flags? Wikipedia commons has [all the flags][wiki]. This script will fetch them for you and write them out into a directory as scaled PNGs, assuming you have [Node.js][node] and whatever else is needed for this do run (look in `package.json`).


# Way of the *Command line*

Here is the usage dump:

    $ node flags.js --help

    Scrape and serve or write Wikipedia flags as bitmaps.
    Usage: node ./flags [options]

    Some options must be provided, either --server or -w or -h.
            
    Options:
      -w, --width      Maximum allowed image width                   [default: 1000]
      -h, --height     Maximum allowed image height                  [default: 1000]
      --server         Start a simple test server
      -p, --port       Server port                                   [default: 8080]
      --usage, --help  Show usage
      --lowercase      Filename should be lower case.               [default: false]
      --filenames      What flag property to use as a filename for each written
                       file.Available properties are "id" (name string), "iso2"
                       (ISO 3166-1 alpha-2 only), "iso3" (ISO 3166-1 alpha-3 only),
                       "fifa" (FIFA country codes), "ioc" (IOC country codes). Only
                       flags with corresponding properties will be output. Multiple
                       ID strings may be listed comma separated: "iso2,iso3" (try 2
                       char ISO, then 3 char, then ignore the flag).
                                                                     [default: "id"]


# Way of the *Test server*

If you're only testing things out you may want to use the server option. This runs a simple node HTTP-server that listens on the port of your choice and serves flag images as either the original SVG or as PNG.

You can ask for flags by a combination of properties: `http://localhost:8080/[country name|flag].[svg|png]?[code]=[ID]`

Some examples:

    http://localhost:8080/flag.svg?ISO=fr
    http://localhost:8080/flag.svg?IOC=fr
    http://localhost:8080/flag.svg?FIFA=fr
    http://localhost:8080/flag.svg?country=france
    http://localhost:8080/flag.svg?country=france
    http://localhost:8080/france.svg
    http://localhost:8080/france.png?width=64&height=40


**Warning:** This assumes your usual developer "just read the code" know-how and should absolutely not be run as a production server.


[wiki]: https://commons.wikimedia.org/wiki/National_insignia
[node]: http://nodejs.org/
