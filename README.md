# RailboundSolver

RailboundSolver is a logic-based solving algorithm designed to find the "best" solution for any level configuration from the game _Railbound_.

The program was made primarily by [myself](https://github.com/FoxtrotOnce) over the course of a year during high school, with contributions from [Thinh](https://github.com/Th1nhNg0) on the website UI and [Al](https://github.com/alistair-broomhead) on coding advice. Their input has greatly improved the program.

# Installation

Run the following in a terminal or command prompt to copy the repository. It will install to the directory specified in the terminal/command prompt.
```
git clone https://github.com/FoxtrotOnce/RailboundSolver.git
```

# Usage

Currently, RailboundSolver can only be used by running `algo/main.py`.

To solve a level, uncomment line 558 of `algo/main.py` (shown below) and change the level name to the level you want to solve.
```
# lvls = {'test-1': lvls['test-1']}
```
To solve a world (or a group) of levels, change line 559 to be `worlds['world_name']` instead of `lvls`.
```
for lvl_name, data in worlds['2'].items():
```
To solve a custom level, create a new level in `levels.json` and run it as shown above.  
A sample level, `test-1`, is at the top of the file for reference on how to create a level.  
- `board` uses ints corresponding to tracks that can be found in the Track class in `algo/classes.py`.
- `mods` uses ints corresponding to mods that can be found in the Mod class in `algo/classes.py`.
- `mod_nums` is the "group" the mod is in.
  - Tunnels with the same mod num connect.
  - Switches will trigger gates and swapping tracks that have the same mod num as the switch.
  - The mod num on stations and post offices indicates what car number corresponds to it.

# To-do

- Integrate RailboundSolver into a website for easier use

# Documentation

### [Afterburn Discord Thread](https://discord.com/channels/441217491612598272/1142318326136180796)

### Program Flowchart
![Flowchart](https://i.ibb.co/mCwvp0PV/Railbound-Solver-drawio.png)

# License

RailboundSolver is an open-sourced software licensed under the [MIT license](https://opensource.org/license/MIT "MIT license").
