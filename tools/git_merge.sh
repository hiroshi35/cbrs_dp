#!/bin/bash

DST_BRANCH="dev"
SRC_BRANCH="$1"

if [[ $# -eq 0 ]]; then
    echo 'usage: bash git_merge.sh branch_name'
    exit 0
fi

echo
echo "You want to merge $SRC_BRANCH into $DST_BRANCH branch?"
read -p "press Ctrl-C to cancel or press enter to continue" -n 1
echo

echo
echo "Now checkout branch $DST_BRANCH"
git checkout $DST_BRANCH

echo
echo "update branch $DST_BRANCH"
git pull origin $DST_BRANCH

echo "Now checkout branch $SRC_BRANCH"
git checkout $SRC_BRANCH

echo
echo "merge $DST_BRANCH into $SRC_BRANCH"
git merge $DST_BRANCH

echo
echo "Is everything ok?"
read -p "press Ctrl-C to cancel or press enter to continue" -n 1
echo

echo
echo "Now checkout branch $DST_BRANCH"
git checkout $DST_BRANCH

echo
echo "merge $SRC_BRANCH into $DST_BRANCH"
git merge --no-ff $SRC_BRANCH

echo
echo "Is everything ok?"
read -p "press Ctrl-C to cancel or press enter to continue" -n 1
echo

git push origin $DST_BRANCH
git branch -d $SRC_BRANCH
git push origin --delete $SRC_BRANCH

