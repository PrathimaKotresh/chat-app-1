/* eslint-disable no-undef */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-console */
/* eslint-disable no-useless-constructor */
import PropTypes from 'prop-types';
import React from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import firebase from 'firebase';

const styles = StyleSheet.create({
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10,
  },
  wrapper: {
    borderRadius: 13,
    borderColor: '#b2b2b2',
    borderWidth: 2,
    flex: 1,
  },
  iconText: {
    color: '#b2b2b2',
    fontWeight: 'bold',
    fontSize: 10,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
});

export default class CustomActions extends React.Component {
  constructor() {
    super();
  }

  /**
   * @function onActionPress
   * @returns {actionSheet}
   */
  onActionPress = () => {
    const options = [
      'Select Image from Library',
      'Take a Photo',
      'Share Location',
      'Cancel',
    ];

    /**
      * requests permission & allows you to pick image and sends url to uploadImage & onSend
      * @async
      * @function pickImage
      */
    pickImage = async () => {
      try {
        const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

        if (status === 'granted') {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
          }).catch((error) => console.log(error));

          if (!result.cancelled) {
            const imageUrl = await this.uploadImage(result.uri);
            this.props.onSend({ image: imageUrl });
          }
        }
      } catch (error) {
        console.log(error.message);
      }
    };

    /**
      * requests permission & allows you to take photo, sends url to uploadImage and onSend
      * @async
      * @function takePhoto
      *
      */
    takePhoto = async () => {
      try {
        const { status } = await Permissions.askAsync(
          Permissions.CAMERA,
          Permissions.CAMERA_ROLL,
        );

        if (status === 'granted') {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          }).catch((error) => console.log(error));

          if (!result.cancelled) {
            const imageUrlLink = await this.uploadImage(result.uri);
            this.props.onSend({ image: imageUrlLink });
          }
        }
      } catch (error) {
        console.log(error.message);
      }
    };

    /**
      * @function uploadImage
      * @returns {Promise} XMLHttpRequest
      */
    uploadImage = async (uri) => {
      try {
        const blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => {
            resolve(xhr.response);
          };
          xhr.onerror = (error) => {
            console.error(error);
            reject(new TypeError('Network Request Failed!'));
          };
          xhr.responseType = 'blob';
          xhr.open('GET', uri, true);
          xhr.send(null);
        });
        const getImageName = uri.split('/');
        const imageArrayLength = getImageName[getImageName.length - 1];
        const ref = firebase
          .storage()
          .ref()
          .child(`images/${imageArrayLength}`);

        const snapshot = await ref.put(blob);
        blob.close();
        const imageURL = await snapshot.ref.getDownloadURL();
        return imageURL;
      } catch (error) {
        console.log(error.message);
      }
    };

    /**
     * requests permission for geo coords
     * @async
     * @function getLocation
     * @returns {Promise<number>}
     */
    getLocation = async () => {
      const { status } = await Permissions.askAsync(Permissions.LOCATION);
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({});
          if (location) {
            this.props.onSend({
              location: {
                longitude: location.coords.longitude,
                latitude: location.coords.latitude,
              },
            });
          }
        } catch (error) {
          console.log(error);
        }
      }
    };

    const cancelButtonIndex = options.length - 1;
    this.context.actionSheet().showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            return this.pickImage();
          case 1:
            return this.takePhoto();
          case 2:
            return this.getLocation();
          default:
        }
      },
    );
  };

  render() {
    return (
      <TouchableOpacity
        accessible
        accessibilityLabel="Click for options"
        style={[styles.container]}
        onPress={this.onActionPress}
      >
        <View style={[styles.wrapper, this.props.wrapperStyle]}>
          <Text style={[styles.iconText, this.props.iconTextStyle]}>+</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

CustomActions.contextTypes = {
  actionSheet: PropTypes.func,
};
CustomActions.propTypes = {
  onSend: PropTypes.string.isRequired,
  wrapperStyle: PropTypes.string.isRequired,
  iconTextStyle: PropTypes.string.isRequired,
};
