param(
    [string]$entry
)

if (-not $entry) {
    write-host "Usage: start-inspect [entry.js]"
    exit 1
}

tsc --sourceMap true
node --inspect-brk $entry