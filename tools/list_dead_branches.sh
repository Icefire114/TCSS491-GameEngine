#!/bin/bash
git branch -v | grep gone | awk '{print $1}'