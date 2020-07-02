#!/bin/bash

C_FORMATTER=clang-format-3.8
SRC_DIR="../src"

find $SRC_DIR -mindepth 1 -maxdepth 10 -type d | while read -r dir
do
  pushd "$dir"  # note the quotes, which encapsulate whitespace
  # exclusive
  if [ $dir != "../src/x2ap/asn1" ]
  then
    echo $dir
    $C_FORMATTER -i *.c *.h
  fi
  popd
done
