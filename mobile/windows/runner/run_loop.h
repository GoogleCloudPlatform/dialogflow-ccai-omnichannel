/* Copyright 2021 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

#ifndef RUNNER_RUN_LOOP_H_
#define RUNNER_RUN_LOOP_H_

#include <flutter/flutter_engine.h>

#include <chrono>
#include <set>

// A runloop that will service events for Flutter instances as well
// as native messages.
class RunLoop {
 public:
  RunLoop();
  ~RunLoop();

  // Prevent copying
  RunLoop(RunLoop const&) = delete;
  RunLoop& operator=(RunLoop const&) = delete;

  // Runs the run loop until the application quits.
  void Run();

  // Registers the given Flutter instance for event servicing.
  void RegisterFlutterInstance(
      flutter::FlutterEngine* flutter_instance);

  // Unregisters the given Flutter instance from event servicing.
  void UnregisterFlutterInstance(
      flutter::FlutterEngine* flutter_instance);

 private:
  using TimePoint = std::chrono::steady_clock::time_point;

  // Processes all currently pending messages for registered Flutter instances.
  TimePoint ProcessFlutterMessages();

  std::set<flutter::FlutterEngine*> flutter_instances_;
};

#endif  // RUNNER_RUN_LOOP_H_
