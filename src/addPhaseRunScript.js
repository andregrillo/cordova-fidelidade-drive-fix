var xcode = require('xcode');
var fs = require('fs');
var path = require('path');

const projectPath = 'platforms/ios/Drive.xcodeproj/project.pbxproj';
const myProj = xcode.project(projectPath);

TARGET_BUILD_DIR = "${TARGET_BUILD_DIR}";
WRAPPER_NAME = "${WRAPPER_NAME}";
ARCHS = "${ARCHS}";
EXTRACTED_ARCHS = "${EXTRACTED_ARCHS}";

var options = {
    shellPath: '/bin/sh',
    shellScript:
    `echo "Target architectures: $ARCHS"

    APP_PATH="${TARGET_BUILD_DIR}/${WRAPPER_NAME}"

    find "$APP_PATH" -name '*.framework' -type d | while read -r FRAMEWORK
    do
    FRAMEWORK_EXECUTABLE_NAME=$(defaults read "$FRAMEWORK/Info.plist" CFBundleExecutable)
    FRAMEWORK_EXECUTABLE_PATH="$FRAMEWORK/$FRAMEWORK_EXECUTABLE_NAME"
    echo "Executable is $FRAMEWORK_EXECUTABLE_PATH"
    echo $(lipo -info "$FRAMEWORK_EXECUTABLE_PATH")

    FRAMEWORK_TMP_PATH="$FRAMEWORK_EXECUTABLE_PATH-tmp"

    # remove simulator's archs if location is not simulator's directory
    case "${TARGET_BUILD_DIR}" in
    *"iphonesimulator")
        echo "No need to remove archs"
        ;;
    *)
        if $(lipo "$FRAMEWORK_EXECUTABLE_PATH" -verify_arch "i386") ; then
        lipo -output "$FRAMEWORK_TMP_PATH" -remove "i386" "$FRAMEWORK_EXECUTABLE_PATH"
        echo "i386 architecture removed"
        rm "$FRAMEWORK_EXECUTABLE_PATH"
        mv "$FRAMEWORK_TMP_PATH" "$FRAMEWORK_EXECUTABLE_PATH"
        fi
        if $(lipo "$FRAMEWORK_EXECUTABLE_PATH" -verify_arch "x86_64") ; then
        lipo -output "$FRAMEWORK_TMP_PATH" -remove "x86_64" "$FRAMEWORK_EXECUTABLE_PATH"
        echo "x86_64 architecture removed"
        rm "$FRAMEWORK_EXECUTABLE_PATH"
        mv "$FRAMEWORK_TMP_PATH" "$FRAMEWORK_EXECUTABLE_PATH"
        fi
        ;;
    esac

    echo "Completed for executable $FRAMEWORK_EXECUTABLE_PATH"
    echo $(lipo -info "$FRAMEWORK_EXECUTABLE_PATH")

    done`
};

myProj.parse(function(err) {
    myProj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Run script', myProj.getFirstTarget().uuid, options);
    fs.writeFileSync(projectPath, myProj.writeSync());
})