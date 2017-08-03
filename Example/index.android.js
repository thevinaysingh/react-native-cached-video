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
  View,
  TextInput,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import CachedVideo from 'react-native-cached-video';
import VideoPlayer from 'react-native-video-player';


export default class TestProject extends Component {
  constructor() {
    super();
    this.state ={
      url: '',
      uri: 'http://www.sample-videos.com/video/mp4/480/big_buck_bunny_480p_1mb.mp4',
    };
    this.testUri = this.testUri.bind(this);
  }

  testUri() {
    this.state.url.includes('http:') || this.state.url.includes('https') ?
      this.setState({ uri: this.state.url }) : alert('This is not valid url')
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView>
        <Text style={styles.welcome}>
          Welcome to Cached video Example
        </Text>
        <Text style={styles.instructions}>
         Enter a valid url Click on test button
        </Text>
        <TextInput
          onChangeText={(url) => this.setState({url})}
          placeholder={'Enter video url'}
          placeholderTextColor={'grey'}
          style={styles.textInput}
          underlineColorAndroid={'transparent'}
        />

        <TouchableOpacity
          onPress={()=> this.testUri()}
          style = {styles.button}
        >
          <Text style={[styles.welcome, { color: 'red' }]}>
              Test
          </Text>
        </TouchableOpacity>

        <CachedVideo
          style={styles.video}
          source={{ uri: this.state.uri }}
        />
        </ScrollView>
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
  textInput: {
    margin: 10,
    height: 50,
    borderColor: 'grey',
    alignSelf: 'stretch',
    borderWidth: 1,
  },
  button: {
    borderWidth: 1,
    margin: 10,
    alignSelf: 'stretch',
    height: 40,
    borderColor: 'red',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
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
  video: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    width: 300,
    height: 300,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

AppRegistry.registerComponent('TestProject', () => TestProject);
