# Obsidian Script Runner Plugin

A plugin to run scripts directly in obsidian.

To use the plugin, create a code block with `runner-[code language goes here]` as the language.
The first line must be a comment with the content `script-id: [UUID goes here]`.
To generate UUIDs, the plugin offers the command `Generate UUID`.

Example with js (replace single quotes with backticks for the code block)

```
'''js-runner
// script-id: [UUID goes here]

[code goes here]
'''
```

### Features

-   real time console output
-   real time console input (for scripting languages that support it)
-   termination of the script (for scripting languages that support it)
-   configurable execution path (file relative and vault relative) (for scripting languages that support it)
-   persistent console (shows the output from the last time the script was run, even after obsidian restart)

### Language support

#### Current

-   js
-   python
-   octave (.m)

#### Planned

-   bash

### How it works

The plugin works by creating a file out of the code block and then running the script from the command line.
