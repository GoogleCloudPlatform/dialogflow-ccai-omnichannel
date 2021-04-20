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

#include "run_loop.h"

#include <windows.h>

#include <algorithm>

RunLoop::RunLoop() {}

RunLoop::~RunLoop() {}

void RunLoop::Run() {
  bool keep_running = true;
  TimePoint next_flutter_event_time = TimePoint::clock::now();
  while (keep_running) {
    std::chrono::nanoseconds wait_duration =
        std::max(std::chrono::nanoseconds(0),
                 next_flutter_event_time - TimePoint::clock::now());
    ::MsgWaitForMultipleObjects(
        0, nullptr, FALSE, static_cast<DWORD>(wait_duration.count() / 1000),
        QS_ALLINPUT);
    bool processed_events = false;
    MSG message;
    // All pending Windows messages must be processed; MsgWaitForMultipleObjects
    // won't return again for items left in the queue after PeekMessage.
    while (::PeekMessage(&message, nullptr, 0, 0, PM_REMOVE)) {
      processed_events = true;
      if (message.message == WM_QUIT) {
        keep_running = false;
        break;
      }
      ::TranslateMessage(&message);
      ::DispatchMessage(&message);
      // Allow Flutter to process messages each time a Windows message is
      // processed, to prevent starvation.
      next_flutter_event_time =
          std::min(next_flutter_event_time, ProcessFlutterMessages());
    }
    // If the PeekMessage loop didn't run, process Flutter messages.
    if (!processed_events) {
      next_flutter_event_time =
          std::min(next_flutter_event_time, ProcessFlutterMessages());
    }
  }
}

void RunLoop::RegisterFlutterInstance(
    flutter::FlutterEngine* flutter_instance) {
  flutter_instances_.insert(flutter_instance);
}

void RunLoop::UnregisterFlutterInstance(
    flutter::FlutterEngine* flutter_instance) {
  flutter_instances_.erase(flutter_instance);
}

RunLoop::TimePoint RunLoop::ProcessFlutterMessages() {
  TimePoint next_event_time = TimePoint::max();
  for (auto instance : flutter_instances_) {
    std::chrono::nanoseconds wait_duration = instance->ProcessMessages();
    if (wait_duration != std::chrono::nanoseconds::max()) {
      next_event_time =
          std::min(next_event_time, TimePoint::clock::now() + wait_duration);
    }
  }
  return next_event_time;
}
