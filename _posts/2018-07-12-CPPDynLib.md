---
layout: post
title:  "Writing a Cross-Platform Dynamic Library"
categories: 
- C++
last_modified_at:   2018-07-12 18:08:00 +0000
comments: true
---
I've recently had to code a cross-platform, dynamic, language-agnostic library in C++, meant to be used in Unity and Unreal Engine on Linux, Mac and Windows. While there's already quite a bit of literature on the topic of dynamic libraries in C++, I encountered some strange bugs and lack of information when it came to a few specific things. I've therefore decided to write about my experience and the solution to the problems we encountered along the way, to hopefully save someone else some time. This is more of an aggregator of knowledge than anything, I don't claim to have invented the wheel here.

A quick disclaimer however: this post isn't meant to teach you how to code in C++, what a CMakeList is or what a dynamic library is. There are already lots of resources on this and my goal here is just to share my knowledge with this specific project, if you don't understand part of this post I recommend you go research it before reading on. I'll be dividing up this post in a few sections which are mostly independent, so you can skip them if you're confident they'll teach you nothing. Some parts will also focus on some quirks of integrating a dynamic library with Unreal and Unity.

## Introducing the Project
My team and I are working on a pair of gloves which provide haptic feedback to people when they use the LeapMotion. The idea is simple: we provide an API to developers, who can use it to send vibrations in whatever pattern they want to whatever motor they want. We need to develop an Unity asset and an Unreal Engine asset to make life easier for developers, and to make sure the project is extensible we also need a low-level SDK which can basically be called from any language. A dynamic library therefore makes the most sense, to have a single codebase which takes care of communication with the gloves while the Unity and Unreal devs can worry about presentation and additional features without ever worrying about actually doing all the low-level work involved in connecting to the glove. [The repo is here if you're interested in looking at the source](https://github.com/RoukaVici/LibRoukaVici).

While our target audience is basically only going to run Windows, most of our developers are either on Linux or on Mac, and there's no telling where the project might go later, so I opted to make the code platform-agnostic to make everyone's lives easier. C++ was also the language of choice here, since I didn't want any funny business with a higher level language locking me out of a low-enough level API (and I really like C++ anyway).

Another important limitation is that the exported functions have to be usable in any language. The idea being that if someone wants to import my library in Python and write their own interface with our glove, my library shouldn't limit them. So no structures, no enums, etc, we need to use exported C functions, chars, ints and pointers on those types.

Our codebase is already a bit cluttered and would make for a tedious first read, so instead of walking you through our code I'll build a much simpler C++ dynamic library in this post, using the same techniques as in our project. This should give you the tools you need in case you want to dive into my sources for any reason. So let's build a library!

## A simple add() function
I like to make an addition function to test libraries, so let's do that:

{% highlight c++ %}
// main.cpp
extern "C"
{
  EXPORTED int add(int a, int b)
  {
      return a + b;
  }
}
{% endhighlight %}

`EXPORTED`, here, is a macro which will allow us to define import and export keywords at compile time. This is necessary because Windows needs to be told it should export symbols at compile time, that it should import them at run time, and ELF systems don't need anything said there by default since they export every simbol by default, so, in a header file, we need:

{% highlight c %}
// exported.h
#pragma once

// Define EXPORTED for any platform
#ifdef _WIN32
# ifdef WIN_EXPORT
#   define EXPORTED  __declspec( dllexport )
# else
#   define EXPORTED  __declspec( dllimport )
# endif
#else
# define EXPORTED
#endif
{% endhighlight %}

Note that while this is a simple and functional implementation, a more complete implementation supporting Cygwin and the ELF visibility attribute looks like:
{% highlight c %}
#pragma once

// Define EXPORTED for any platform
#if defined _WIN32 || defined __CYGWIN__
  #ifdef WIN_EXPORT
    // Exporting...
    #ifdef __GNUC__
      #define EXPORTED __attribute__ ((dllexport))
    #else
      #define EXPORTED __declspec(dllexport) // Note: actually gcc seems to also supports this syntax.
    #endif
  #else
    #ifdef __GNUC__
      #define EXPORTED __attribute__ ((dllimport))
    #else
      #define EXPORTED __declspec(dllimport) // Note: actually gcc seems to also supports this syntax.
    #endif
  #endif
  #define NOT_EXPORTED
#else
  #if __GNUC__ >= 4
    #define EXPORTED __attribute__ ((visibility ("default")))
    #define NOT_EXPORTED  __attribute__ ((visibility ("hidden")))
  #else
    #define EXPORTED
    #define NOT_EXPORTED
  #endif
#endif
{% endhighlight %}
You can then use EXPORTED and NOT_EXPORTED to optimize your dynamic library and only export the symbols you want (by default, on ELF systems, every symbol is exported). More about the visibility attribute [here](https://gcc.gnu.org/wiki/Visibility).

But maybe you don't want to write those header files yourself, in which case you can use the CMake [GenerateExportHeader](https://cmake.org/cmake/help/v3.0/module/GenerateExportHeader.html) module which also gives you access to DEPRECATED macros and the likes.

We import the header file in our source code and voilà! Now all the export symbol wizardry is handled by the compiler. We'll just have to remember to set `WIN_EXPORT` to true when we compile on Windows (see below). Good! Will this work? Well, let's make a CMakeLists and see.

## CMake
Setting up CMake is easy enough for cross-platform, but there are quirks to work out. First a short description of how to make a dynamic library in CMake this is a stripped down and simplified version of the CMakeLists in our project which you can find [here](https://github.com/RoukaVici/LibRoukaVici/blob/master/CMakeLists.txt):
{% highlight cmake %}
# CMakeLists.txt

# Always set the cmake min version.
cmake_minimum_required(VERSION 3.0)

set (PROJECT_VERSION "1.0")

# Set the variable PROJ_NAME to whatever your library's name is, PROJECT_VERSION should be a version string like "0.1"
project(mylib VERSION ${PROJECT_VERSION})

# To build shared libraries in Windows, we set CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS to TRUE.
# See https://cmake.org/cmake/help/v3.4/variable/CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS.html
# See https://blog.kitware.com/create-dlls-on-windows-without-declspec-using-new-cmake-export-all-feature/
set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)

# Create our library target
add_library(mylib SHARED)

target_sources(mylib
  ${CMAKE_CURRENT_SOURCE_DIR}/main.cpp
)

# This will name your output .so files "libsomething.1.0" which is pretty useful
set_target_properties(roukavici
PROPERTIES
    VERSION ${PROJECT_VERSION}
    SOVERSION ${PROJECT_VERSION}
)

# Let's set compiler-specific flags
if (${CMAKE_CXX_COMPILER_ID} STREQUAL "GNU")
    # G++
    target_compile_options(roukavici PRIVATE -Wall -Wextra)
elseif(${CMAKE_CXX_COMPILER_ID} STREQUAL "MSVC")
    # MSVC
    target_compile_options(roukavici PRIVATE /EHsc /MTd /W2 /c)
    # Set the DLLEXPORT variable to export symbols
    target_compile_definitions(roukavici PRIVATE WIN_EXPORT)
endif()
{% endhighlight %}

If you're unfamiliar with this modern CMake syntax, I highly recommend you read articles on it like [this one](https://pabloariasal.github.io/2018/02/19/its-time-to-do-cmake-right/), because my post alone isn't enough to cover the vast topic that is CMake best practices. Now let's build it, this is what it should look like on Linux:
{% highlight console %}
[demo]$ ls
CMakeLists.txt  exported.h  main.cpp
[demo]$ mkdir build && cd build/ && cmake .. && cmake --build .
-- The C compiler identification is GNU 8.1.1
[...]
Scanning dependencies of target mylib
[ 50%] Building CXX object CMakeFiles/mylib.dir/main.cpp.o
[100%] Linking CXX shared library libmylib.so
[100%] Built target mylib
[build]$ ls
CMakeCache.txt  CMakeFiles  cmake_install.cmake  libmylib.so  libmylib.so.1.0  Makefile
{% endhighlight%}

The experience should be the same on Windows, though you'll have to install MSVC++ and CMake beforehand of course. Note that I use `cmake --build .` instead of calling the compiler directly, which saves me a lot of hassle and makes this command cross-platform and cross-compiler, I highly recommend it.

**Note:** Windows will always compile in 32bit by default, regardless of your computer's architecture. If you need the library to be in 64bit, you need to use `cmake -G "Visual Studio 15 2017 Win64" ..`. Windows will also output two files, a `.dll` and a `.lib`, both of which should be used to call your library.

Now, this CmakeLists is fine and all, but problems arise when you start to add dependencies.

## CMake Dependencies
Because this is cross-platform, I highly recommend building dependencies from source, it'll save you some hassle in a lot of areas. This section will go over adding other CMake projects as your dependency directly, from source, meaning that all you need is the dependency's project directory, with its `CMakeLists.txt` file at the root.

Here we'll put the dependency "libdependency" in the folder `lib/libdependency/`, so `lib/libdependency/` should contain the dependency's CMakeList. Let's add it to our project's CMakeLists:

{% highlight cmake %}
# CMakeLists.txt
# This line will export your dependency's symbols and make them available to your project on Windows. Without this your code will compile but it won't run on Windows!
set(CMAKE_WINDOWS_EXPORT_ALL_SYMBOLS ON)

# You may want to add their include directories since your code might use their header files. If libdependency is exporting its symbols properly you shouldn't have to do this though.
target_include_directories(mylib PRIVATE ./lib/libdependency/src)
# We can now add their CMakeList as a child to ours.
add_subdirectory(./lib/libdependency/)

# And now, we tell CMake that libdependency should be linked to our library
target_link_libraries(mylib PRIVATE libdependency)
{% endhighlight %}

There's a more complete description of `add_subdirectory` for multiple dependencies and the likes in [this stackoverflow thread](https://stackoverflow.com/questions/16398937/cmake-and-finding-other-projects-and-their-dependencies/16404000). And there you go, you now have a functional `CMakeLists.txt` which can build itself and its dependencies on Windows, Mac and Linux. But our code isn't even using C++ classes! Let's try and do that.

## One Class to Rule Them All
So my objective when I started this project was to have two entry points for my API: A C++ class which the Unreal project could just use as-is with `new()` and a C API which would mirror every public method of the C++ class, to be imported in Unity. While this is what I did, I should make it clear:  **Unreal Engine will not let you import C++ classes like that**, as far as we can tell the C API is the only one you can use for Unreal Engine. Still, making a single class for everything is a nice way to centralize everything, and it works really well! So let's do that:

{% highlight c++ %}
// apiClass.hh:
#include "exported.h"

class EXPORTED apiClass {
public:
  apiClass();
  ~apiClass();

  int add(int a, int b);
};

// apiClass.cpp
#include "apiClass.hh"

apiClass::apiClass() {
  // construction here
}

apiClass::~apiClass() {
  // destruction here
}

int apiClass::add(int a, int b) {
  return a + b;
}
{% endhighlight%}

Now that we have this class, we can use it in our C API in order to have a single codebase for everything. We'll need to add a method to initialize the library, and one to close it:

{% highlight c++ %}
// main.cpp
#include "exported.h"
#include "apiClass.hh"

apiClass *ptr = nullptr;

extern "C"
{
  EXPORTED void initLib()
  {
    ptr = new apiClass();
  }

  EXPORTED void closeLib()
  {
    delete ptr;
  }

  EXPORTED int add(int a, int b)
  {
    return ptr->add(a, b);
  }
}
{% endhighlight %}

And this works! It'll work on every platform, and if you're using the library in C++ you can just do `new apiClass()` and completely bypass the C functions. You can opt to check the `ptr` value before calling it in `add()` if you'd like. A few notes and tips about this system:
- You can't have STL containers as members of the C++ class. I know it's silly but Windows simply won't allow it out of the box with C-style linkage, there are ways to make it work but it's an absolute pain and not worth the effort. If you **really** want to do it, read [this](https://stackoverflow.com/questions/22797418/how-do-i-safely-pass-objects-especially-stl-objects-to-and-from-a-dll) but my recommendation is: if you need an STL container just make a small wrapper class around it and put that as a member instead.
- The C functions can obviously only take very basic types. You can receive strings though, which is good news. I don't recommend using structures unless you're 100% sure that your library will be used by developers in C/C++, I haven't personally tested how "exportable" structures are to other languages, could a Python programmer respect my structure code? I'd much rather make a simpler system with multiple C functions which allow the user to manipulate a structure internal to our library.
- **Don't use a singleton for the class!** Seriously don't, it can lead to a lot of really weird bugs because you can't be sure of how your library is being used. Unity specifically will run fine the first time, but it'll keep the old singleton value saved on second run, even after the user asked Unity to close the library, so on second run the program will segfault because the singleton points to free'd memory.
- Here I'm using a global pointer for apiClass since in this specific case I'm not too confident in the receiving programming language to handle a C pointer. This has its own set of issues, in particular with thread-safety, you can also have `initLib` return an opaque pointer to an apiClass and have the client send it along with every function.

So you're ready to get coding, good, but good error messages are important, and you can't be sure that your user will have a console output! (No, Unity and Unreal do not pipe the standard output to their built-in console). Let's get on that.

## A Logging System
So first of all, the logging system needs to run outside of the current scope that we have defined, where we initialize with `initLib()`. Why? Because we might want to log the initialization of the library, in case something goes wrong! The user therefore needs to be able to manipulate these functions before initializing the library. So we make it into a namespace instead:

{% highlight c++ %}
// Debug.hh
namespace Debug {
  void SetLogMode(const int method);
  void Log(const std::string& msg, bool force = false);
}
{% endhighlight%}

Log modes can be anything you want, in the case of my project the values are:
- 0: Write to std::cout/std::cerr (default)
- 1: Write to file
- 2: Use DebugCallback
- 3: Use UnityDebugCallback
- 4: No logging.

They can be an enum internally, but you need to expose them as an `int` in the C API anyway for the language-agnosticism. These functions aren't anything special and if you're insterested in how I implemented them you can find the complete source code for [Debug.hh](https://github.com/RoukaVici/LibRoukaVici/blob/master/src/Debug.hh) and [Debug.cpp](https://github.com/RoukaVici/LibRoukaVici/blob/master/src/Debug.cpp) on our repository. There is one mode which is interesting to talk about though, and it's that I give the user the ability to set a callback function.

The issue arose because both Unity and Unreal Engine fail to redirect `std::cout/cerr` to their built-in consoles, but my developers wanted to be able to see my messages there. The system I used isn't entirely of my own making, I used the system described [here](https://answers.unity.com/questions/30620/how-to-debug-c-dll-code.html) and simply made it cross-platform, but the gist of it is that I let the user send me a callback function which gets sent the string to log. The user can then do whatever they want with the string. There needs to be a separate mode for Unity as Unity defines its callback function differently (since it's in C#, I would assume). This is the typedef I use for the callback parameters:
{% highlight c++ %}
// DebugCallback.hh
#pragma once

#ifdef _WIN32
// This allows us to receive functions from Unity
typedef void(__stdcall * UnityDebugCallback) (const char * str);
#else
typedef void (*UnityDebugCallback)(const char* str);
#endif

typedef void (*DebugCallback)(const char* str);
{% endhighlight %}

I can then use the types `UnityDebugCallback` and `DebugCallback` to receive functions respectively from Unity and any other system, and this system works, again, on Linux, Mac and Windows.

## Conclusion
That's about all I have to say about this project when it comes to the build system and how I abstracted everything to work on Mac, Linux and Windows across Unreal Engine, Unity and anything else that can import C functions. I tend to dislike blog posts that beat around the bush and I attempted to keep the information condensed, I hope it was informative for whoever reads this. Good luck with your own project!