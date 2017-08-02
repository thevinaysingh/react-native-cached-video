/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';
import CachedVideo from 'react-native-cached-video';

export default class TestProject extends Component {
  render() {
    return (
      <View style={styles.container}>
        <CachedVideo
          style={{ width: 300, height: 300, backgroundColor: 'grey' }}
          source={{ uri: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4' }}
          thumbnail={{ uri: 'http://www.iconsdb.com/icons/preview/black/play-xxl.png' }}
        />
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('TestProject', () => TestProject);
