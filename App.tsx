import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StatusBar,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  PermissionsAndroid,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import {openDatabase} from 'react-native-sqlite-storage';
import {captureRef} from 'react-native-view-shot';
import CameraRoll from '@react-native-community/cameraroll';
import Share from 'react-native-share';

const db = openDatabase({
  name: 'rn_sqlite',
});

interface Category {
  item?: any;
  deleteCategory?: Function;
  editCategory?: Function;
}

const CategoryItem = ({item, deleteCategory, editCategory}: Category) => {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const [visible, setVisible] = useState(false);
  const toggleEdit = () => {
    setEditing(!editing);
  };

  const handleSave = () => {
    editCategory && editCategory(item.id, newName);
    toggleEdit();
  };

  const viewRef = useRef();

  // get permission on android
  const getPermissionAndroid = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Image Download Permission',
          message: 'Your permission is required to save images to your device',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }
      Alert.alert(
        '',
        'Your permission is required to save images to your device',
        [{text: 'OK', onPress: () => {}}],
        {cancelable: false},
      );
    } catch (err) {
      // handle error as you please
      console.log('err', err);
    }
  };

  // download image
  const downloadImage = async () => {
    try {
      // react-native-view-shot caputures component
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });

      if (Platform.OS === 'android') {
        const granted = await getPermissionAndroid();
        if (!granted) {
          return;
        }
      }

      // cameraroll saves image
      const image = CameraRoll.save(uri, 'photo');
      if (image) {
        Alert.alert(
          '',
          'Image saved successfully.',
          [{text: 'OK', onPress: () => {}}],
          {cancelable: false},
        );
      }
      setVisible(false);
    } catch (error) {
      console.log('error___', error);
    }
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 12,
          paddingHorizontal: 10,
          borderBottomWidth: 1,
          borderColor: '#ddd',
        }}>
        <Text style={{marginRight: 9}}>{item.id}</Text>
        {editing ? (
          <>
            <TextInput
              style={{flex: 1}}
              value={newName}
              onChangeText={setNewName}
            />
            <TouchableOpacity onPress={handleSave}>
              <Text>Save</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                flex: 1,
              }}>
              <View>
                <Text>{item.name}</Text>
              </View>
              <View>
                <TouchableOpacity
                  onPress={() => {
                    setVisible(true);
                  }}>
                  <Image
                    source={{
                      uri: 'https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=75&w=126',
                    }}
                    style={{width: 100, height: 100}}
                  />
                </TouchableOpacity>
              </View>
              <View style={{flexDirection: 'row'}}>
                <TouchableOpacity
                  style={{marginLeft: 10, paddingHorizontal: 5}}
                  onPress={toggleEdit}>
                  <Text>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{marginLeft: 10, paddingHorizontal: 5}}
                  onPress={() => deleteCategory && deleteCategory(item.id)}>
                  <Text>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
      <Modal animationType="slide" transparent={true} visible={visible}>
        <SafeAreaView style={styles.safeAreaView}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            style={styles.scrollView}>
            <View style={styles.body}>
              <View style={styles.savedComponent} ref={viewRef}>
                <Text style={styles.text}> Component to be saved </Text>
                <Image
                  source={{
                    uri: 'https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=75&w=126',
                  }}
                  style={styles.image}
                />
                <Text style={styles.text}>Some random text, also saved</Text>
              </View>
              <View style={styles.row}>
                <TouchableOpacity style={styles.button} onPress={downloadImage}>
                  <Text>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    position: 'absolute',
    zIndex: 2,
    height: '100%',
  },
  scrollView: {
    backgroundColor: 'white',
  },
  body: {
    marginTop: 100,
    alignItems: 'center',
  },
  savedComponent: {
    backgroundColor: 'white',
    marginBottom: 30,
  },
  text: {
    textAlign: 'center',
  },
  image: {
    width: 252,
    height: 150,
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 5,
  },
  row: {
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '75%',
  },
  button: {
    backgroundColor: '#ad4fcc',
    padding: 15,
    paddingHorizontal: 35,
    borderRadius: 5,
  },
});

const App = () => {
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);

  const createTables = () => {
    db.transaction(data => {
      data.executeSql(
        `CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(20))`,
        [],
        (sqldata, res) => {
          console.log('table created successfully');
        },
        error => {
          console.log('error on creating table ' + error.message);
        },
      );
    });
  };

  const addCategory = () => {
    if (!category) {
      alert('Enter category');
      return false;
    }

    db.transaction(data => {
      data.executeSql(
        `INSERT INTO categories (name) VALUES (?)`,
        [category],
        (sqldata, res) => {
          console.log(`${category} category added successfully`);
          getCategories();
          setCategory('');
        },
        error => {
          console.log('error on adding category ' + error.message);
        },
      );
    });
  };

  const getCategories = () => {
    db.transaction(data => {
      data.executeSql(
        `SELECT * FROM categories ORDER BY id DESC`,
        [],
        (sqldata, res) => {
          console.log('categories retrieved successfully');
          let len = res.rows.length;

          if (len > 0) {
            let results = [];
            for (let i = 0; i < len; i++) {
              let item = res.rows.item(i);
              results.push({id: item.id, name: item.name});
            }

            setCategories(results);
          }
        },
        error => {
          console.log('error on getting categories ' + error.message);
        },
      );
    });
  };

  const deleteCategory = categoryId => {
    db.transaction(data => {
      data.executeSql(
        `DELETE FROM categories WHERE id = ?`,
        [categoryId],
        (sqldata, res) => {
          console.log(`Category with ID ${categoryId} deleted successfully`);
          getCategories(); // Refresh the category list
        },
        error => {
          console.log('Error deleting category: ' + error.message);
        },
      );
    });
  };

  const editCategory = (categoryId, newName) => {
    if (!newName) {
      alert('Enter a new category name');
      return;
    }

    db.transaction(data => {
      data.executeSql(
        `UPDATE categories SET name = ? WHERE id = ?`,
        [newName, categoryId],
        (sqldata, res) => {
          console.log(`Category with ID ${categoryId} updated successfully`);
          getCategories(); // Refresh the category list
        },
        error => {
          console.log('Error updating category: ' + error.message);
        },
      );
    });
  };
  useEffect(() => {
    async function fetchData() {
      await createTables();
      await getCategories();
    }

    fetchData();
  }, []);

  return (
    <SafeAreaView style={{flex: 1}}>
      <View>
        <StatusBar backgroundColor="#222" />
        <TextInput
          placeholder="Enter category"
          value={category}
          onChangeText={setCategory}
          style={{marginHorizontal: 8}}
        />
        <Button title="Submit" onPress={addCategory} />
        <FlatList
          data={categories}
          renderItem={({item}) => (
            <CategoryItem
              item={item}
              deleteCategory={deleteCategory}
              editCategory={editCategory}
            />
          )}
          keyExtractor={item => item.id.toString()}
        />
      </View>
    </SafeAreaView>
  );
};

export default App;
