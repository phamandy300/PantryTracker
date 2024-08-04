'use client';
import { useRef,useState, useEffect } from 'react';
import { firestore } from '@/firebase';
import { Box, Button, Modal, Stack, TextField, Typography, IconButton, InputBase, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { Camera } from 'react-camera-pro';
import MenuIcon from '@mui/icons-material/Menu';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import EditIcon from '@mui/icons-material/Edit';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Head from 'next/head';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [categoryToRemove, setCategoryToRemove] = useState('');
  const [removeItemsWithCategory, setRemoveItemsWithCategory] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [aiItemOpen, setAiItemOpen] = useState(false);
  const [aiItemName, setAiItemName] = useState('');
  const camera = useRef(null);
  const [numberOfCameras, setNumberOfCameras] = useState(0);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const detectObjects = async (imageElement) => {
    const model = await cocossd.load();
    const predictions = await model.detect(imageElement);
    setDetectedObjects(predictions);
  };

  useEffect(() => {
    if (detectedObjects.length > 0) {
      const objectNames = detectedObjects.map(obj => obj.class);
      const uniqueObjects = [...new Set(objectNames)];
      
      uniqueObjects.forEach((objectName) => {
        setAiItemName(capitalizeFirstLetter(objectName));
        setNewItemCategory('');
        setNewItemQuantity(1);
        setAiItemOpen(true);
      });

      setDetectedObjects([]);
    }
  }, [detectedObjects]);

  const switchCamera = () => {
    if (numberOfCameras > 1) {
      setCurrentCameraIndex((prevIndex) => (prevIndex + 1) % numberOfCameras);
    }
  };

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
  };

  const updateCategories = async () => {
    const snapshot = query(collection(firestore, 'categories'));
    const docs = await getDocs(snapshot);
    const categoryList = [];
    docs.forEach((doc) => {
      categoryList.push(doc.id);
    });
    setCategories(categoryList);
  };

  const removeItemCompletely = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    await deleteDoc(docRef);
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 }, { merge: true });
      }
    }

    await updateInventory();
  };

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 }, { merge: true });
    } else {
      await setDoc(docRef, { quantity: 1 }, { merge: true });
    }

    await updateInventory();
  };

  const addOrUpdateItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item.name);
  
    await setDoc(docRef, { 
      category: item.category || '', 
      quantity: item.quantity || 1 
    });
    await updateInventory();
    return true;
  };

  const addCategory = async (category) => {
    const docRef = doc(collection(firestore, 'categories'), category);
    await setDoc(docRef, { exists: true });
    await updateCategories();
  };

  const removeCategory = async (category, removeItems = false) => {
    const batch = writeBatch(firestore);
    
    if (removeItems) {
      const itemsSnapshot = await getDocs(query(collection(firestore, 'inventory')));
      itemsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category === category) {
          batch.delete(doc.ref);
        }
      });
    } else {
      const itemsSnapshot = await getDocs(query(collection(firestore, 'inventory')));
      itemsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category === category) {
          batch.update(doc.ref, { category: '' });
        }
      });
    }
  
    batch.delete(doc(collection(firestore, 'categories'), category));
    await batch.commit();
    await updateCategories();
    await updateInventory();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleEditOpen = (item) => {
    setEditItem(item);
    setItemName(item.name);
    setItemCategory(item.category || '');
    setItemQuantity(item.quantity || 1);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditItem(null);
  };

  const handleEditSave = async () => {
    if (editItem) {
      if (editItem.name !== itemName) {
        await removeItemCompletely(editItem.name);
      }
      await addOrUpdateItem({ name: itemName, category: itemCategory, quantity: itemQuantity });
    }
    handleEditClose();
    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
    updateCategories();
  }, []);

  const handleOpen = () => {
    setNewItemName('');
    setNewItemCategory('');
    setNewItemQuantity(1);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);
  const handleCategoryClose = () => setCategoryOpen(false);
  const totalItems = inventory.length;
  const totalInventory = inventory.reduce((total, item) => total + item.quantity, 0);
  const totalCategories = categories.length;

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === ''
      ? true
      : selectedCategory === 'none'
      ? !item.category || item.category === ''
      : item.category === selectedCategory)
  );

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <Box display="flex" flexDirection={['column', 'row']} minHeight="100vh" width="100%">
        {/* Sidebar */}
        <Box
          width={['100%', sidebarOpen ? 250 : 60]}
          height={['auto', '100vh']}
          bgcolor="#f0f0f0"
          p={2}
          display="flex"
          flexDirection={['row', 'column']}
          justifyContent="space-between"
          alignItems={['center', 'flex-start']}
          boxShadow="2px 0 5px rgba(0,0,0,0.1)"
          transition="width 0.3s"
          sx={{
            position: ['fixed', 'relative'],
            top: 0,
            left: 0,
            zIndex: 1000,
          }}
        >
          <Box width="100%">
            <Button
              startIcon={<MenuIcon />}
              onClick={toggleSidebar}
              sx={{
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                width: '100%',
                minWidth: sidebarOpen ? 'auto' : '60px',
                textAlign: sidebarOpen ? 'left' : 'center',
                padding: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              {sidebarOpen && 'Menu'}
            </Button>
            {sidebarOpen && (
              <>
                <Button
                  variant="text"
                  fullWidth
                  onClick={handleOpen}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Add Item
                </Button>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => setAddCategoryOpen(true)}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Add Category
                </Button>
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => {
                    setCategoryToRemove('');
                    setCategoryOpen(true);
                  }}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Remove Category
                </Button>
              </>
            )}
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={1}
            width="100%"
          >
            <Button
              onClick={() => setCameraOpen(true)}
              sx={{
                width: '100%',
                justifyContent: 'center',
                minWidth: 'auto',
              }}
            >
              <CameraAltIcon />
            </Button>
          </Box>
        </Box>

        {/* Main Content */}
        <Box flex={1} p={[2, 4]} mt={['60px', 0]}>
          <Stack direction="row" spacing={2} mb={4}>
            <Box
              flex={1}
              p={2}
              bgcolor="#ADD8E6"
              borderRadius={2}
              boxShadow="0 2px 5px rgba(0,0,0,0.1)"
              textAlign="center"
            >
              <Typography variant="h6">Total Items</Typography>
              <Typography variant="h4">{totalItems}</Typography>
            </Box>
            <Box
              flex={1}
              p={2}
              bgcolor="#ADD8E6"
              borderRadius={2}
              boxShadow="0 2px 5px rgba(0,0,0,0.1)"
              textAlign="center"
            >
              <Typography variant="h6">Total Inventory</Typography>
              <Typography variant="h4">{totalInventory}</Typography>
            </Box>
            <Box
              flex={1}
              p={2}
              bgcolor="#ADD8E6"
              borderRadius={2}
              boxShadow="0 2px 5px rgba(0,0,0,0.1)"
              textAlign="center"
            >
              <Typography variant="h6">Total Categories</Typography>
              <Typography variant="h4">{totalCategories}</Typography>
            </Box>
          </Stack>

          {/* Search Bar */}
          <Box
            display="flex"
            alignItems="center"
            mb={2}
            p={1}
            bgcolor="#f9f9f9"
            borderRadius={2}
            boxShadow="0 2px 5px rgba(0,0,0,0.1)"
          >
            <SearchIcon />
            <InputBase
              placeholder="Search items..."
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ ml: 1 }}
            />
          </Box>

          {/* Category Filter */}
          <Box mb={2}>
            <FormControl fullWidth>
              <InputLabel id="category-select-label">Filter by Category</InputLabel>
              <Select
                labelId="category-select-label"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Filter by Category"
              >
                {/* All Categories */}
                <MenuItem value="">
                  All Categories ({inventory.length})
                </MenuItem>
                
                {/* No Category */}
                <MenuItem value="none">
                  No Category ({inventory.filter(item => !item.category || item.category === 'none').length})
                </MenuItem>

                {/* Specific Categories */}
                {categories.map((category) => {
                  const count = inventory.filter(item => item.category === category).length;
                  return (
                    <MenuItem key={category} value={category}>
                      {category} ({count})
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          {/* Inventory List */}
          <Box>
            {filteredInventory.map(({ name, category, quantity }) => (
              <Box
                key={name}
                display="flex"
                flexDirection={['column', 'row']}
                alignItems={['flex-start', 'center']}
                justifyContent="space-between"
                p={2}
                borderBottom="1px solid #ddd"
              >
                <Box
                  display="flex"
                  alignItems="center"
                  mb={[2, 0]}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    minWidth={80}
                    p={1}
                    bgcolor="#e0e0e0"
                    borderRadius={2}
                    boxShadow="0 1px 3px rgba(0,0,0,0.1)"
                    mr={2}
                  >
                    <Typography variant="caption" color="textSecondary" textAlign="center">
                      {category ? category : "None"}
                    </Typography>
                  </Box>
                  <Typography variant="h6">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="contained"
                    onClick={() => {
                      addItem(name);
                    }}
                  >
                    +
                  </Button>
                  <Typography variant="h6">{quantity}</Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      removeItem(name);
                    }}
                  >
                    -
                  </Button>
                  <IconButton
                    aria-label="edit"
                    onClick={() => {
                      handleEditOpen({ name, category, quantity });
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    onClick={() => {
                      removeItemCompletely(name);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Add Item Modal */}
        <Modal open={open} onClose={() => {
          handleClose();
          setNewItemName('');
          setNewItemCategory('');
          setNewItemQuantity(1);
        }}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width={400}
            bgcolor="white"
            border="2px solid #000"
            boxShadow={24}
            p={4}
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Typography variant="h6">Add Item</Typography>
            <TextField
              variant="outlined"
              fullWidth
              label="Item Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <TextField
              variant="outlined"
              fullWidth
              label="Quantity"
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseInt(e.target.value, 10))}
            />
            <FormControl fullWidth>
              <InputLabel id="add-category-select-label">Category</InputLabel>
              <Select
                labelId="add-category-select-label"
                value={newItemCategory}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setAddCategoryOpen(true);
                  } else {
                    setNewItemCategory(e.target.value);
                  }
                }}
                label="Category"
              >
                <MenuItem value="">None</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
                <MenuItem value="new">
                  <em>Add New Category</em>
                </MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={async () => {
                const success = await addOrUpdateItem({
                  name: newItemName,
                  category: newItemCategory,
                  quantity: newItemQuantity,
                });
                if (success) {
                  setNewItemName('');
                  setNewItemCategory('');
                  setNewItemQuantity(1);
                  handleClose();
                }
              }}
            >
              Add
            </Button>
          </Box>
        </Modal>

        {/* Edit Item Modal */}
        <Modal open={editOpen} onClose={handleEditClose}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width={400}
            bgcolor="white"
            border="2px solid #000"
            boxShadow={24}
            p={4}
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Typography variant="h6">Edit Item</Typography>
            <TextField
              variant="outlined"
              fullWidth
              label="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <TextField
              variant="outlined"
              fullWidth
              label="Item Quantity"
              type="number"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(parseInt(e.target.value, 10))}
            />
            <FormControl fullWidth>
              <InputLabel id="edit-category-select-label">Category</InputLabel>
              <Select
                labelId="edit-category-select-label"
                value={itemCategory}
                onChange={async (e) => {
                  if (e.target.value === 'new') {
                    const newCat = setAddCategoryOpen(true);
                    if (newCat) {
                      setItemCategory(newCat);
                    }
                  } else {
                    setItemCategory(e.target.value);
                  }
                }}
                label="Category"
              >
                <MenuItem value="">None</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
                <MenuItem value="new">
                  <em>Add New Category</em>
                </MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={handleEditSave}
            >
              Save
            </Button>
          </Box>
        </Modal>

        {/* Remove Category Modal */}
        <Modal open={categoryOpen} onClose={handleCategoryClose}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width={400}
            bgcolor="white"
            border="2px solid #000"
            boxShadow={24}
            p={4}
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Typography variant="h6">Remove Category</Typography>
            <FormControl fullWidth>
              <InputLabel id="remove-category-select-label">Category to Remove</InputLabel>
              <Select
                labelId="remove-category-select-label"
                value={categoryToRemove}
                onChange={(e) => setCategoryToRemove(e.target.value)}
                label="Category to Remove"
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <Select
                value={removeItemsWithCategory ? 'remove' : 'keep'}
                onChange={(e) => setRemoveItemsWithCategory(e.target.value === 'remove')}
                displayEmpty
              >
                <MenuItem value="keep">Keep Items, Remove Category</MenuItem>
                <MenuItem value="remove">Remove Items and Category</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={() => {
                removeCategory(categoryToRemove, removeItemsWithCategory);
                handleCategoryClose();
              }}
            >
              Remove
            </Button>
          </Box>
        </Modal>

        {/* Add Category Modal */}
        <Modal open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width={400}
            bgcolor="white"
            border="2px solid #000"
            boxShadow={24}
            p={4}
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Typography variant="h6">Add Category</Typography>
            <TextField
              variant="outlined"
              fullWidth
              label="New Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => {
                addCategory(newCategory);
                setNewCategory('');
                setAddCategoryOpen(false);
              }}
            >
              Add
            </Button>
          </Box>
        </Modal>

        {/* Camera Modal */}
        <Modal open={cameraOpen} onClose={() => setCameraOpen(false)}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width="90%"
            height="90%"
            bgcolor="white"
            border="2px solid #000"
            boxShadow={24}
            sx={{
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box flexGrow={1} position="relative" overflow="hidden">
              <Camera
                ref={camera}
                aspectRatio="cover"
                numberOfCamerasCallback={(i) => setNumberOfCameras(i)}
                facingMode={currentCameraIndex % 2 === 0 ? 'environment' : 'user'}
                errorMessages={{
                  noCameraAccessible: 'No camera device accessible. Please connect your camera or try a different browser.',
                  permissionDenied: 'Permission denied. Please refresh and give camera permission.',
                  switchCamera: 'It is not possible to switch camera to different one because there is only one video device accessible.',
                  canvas: 'Canvas is not supported.',
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
            <Box p={2} display="flex" justifyContent="space-between">
              <Button
                variant="contained"
                onClick={async () => {
                  if (camera.current) {
                    const imageSrc = camera.current.takePhoto();
                    const img = new Image();
                    img.src = imageSrc;
                    img.onload = () => {
                      detectObjects(img);
                    };
                    setCameraOpen(false);
                  }
                }}
              >
                Take Picture
              </Button>
              <Button
                onClick={switchCamera}
                disabled={numberOfCameras <= 1}
              >
                <CameraswitchIcon/>
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* AI Detected Item Modal */}
        <Modal open={aiItemOpen} onClose={() => {
          setAiItemOpen(false);
          setAiItemName('');
          setNewItemCategory('');
          setNewItemQuantity(1);
        }}>
          <Box
            position="absolute"
            top="50%"
            left="50%"
            width={400}
            bgcolor="white"
            border="2px solid #000"
            boxShadow={24}
            p={4}
            display="flex"
            flexDirection="column"
            gap={3}
            sx={{
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Typography variant="h6">Add Detected Item</Typography>
            <TextField
              variant="outlined"
              fullWidth
              label="Item Name"
              value={aiItemName}
              onChange={(e) => setAiItemName(capitalizeFirstLetter(e.target.value))}
            />
            <TextField
              variant="outlined"
              fullWidth
              label="Quantity"
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseInt(e.target.value, 10))}
            />
            <FormControl fullWidth>
              <InputLabel id="ai-add-category-select-label">Category</InputLabel>
              <Select
                labelId="ai-add-category-select-label"
                value={newItemCategory}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setAddCategoryOpen(true);
                  } else {
                    setNewItemCategory(e.target.value);
                  }
                }}
                label="Category"
              >
                <MenuItem value="">None</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
                <MenuItem value="new">
                  <em>Add New Category</em>
                </MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              onClick={async () => {
                const success = await addOrUpdateItem({
                  name: capitalizeFirstLetter(aiItemName),
                  category: newItemCategory,
                  quantity: newItemQuantity,
                });
                if (success) {
                  setAiItemName('');
                  setNewItemCategory('');
                  setNewItemQuantity(1);
                  setAiItemOpen(false);
                }
              }}
            >
              Add
            </Button>
          </Box>
        </Modal>
      </Box>
    </>
  );
}
