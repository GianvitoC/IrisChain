import sys
import torch
import warnings
from pathlib import Path
import pandas as pd
from PIL import Image
from torchvision import transforms
model = torch.hub.load('pytorch/vision:v0.10.0', 'resnet18', pretrained=True)
#print(list(model.children()))
layer = model._modules.get('avgpool')
model.eval()
pth = sys.argv[1]
input_image = Image.open(pth).convert('RGB')
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
input_tensor = preprocess(input_image)
input_batch = input_tensor.unsqueeze(0) # create a mini-batch as expected by the model
# move the input and model to GPU for speed if available
if torch.cuda.is_available():
    input_batch = input_batch.to('cuda')
    model.to('cuda')
# initialize feature vector
feature_vector = torch.zeros(1,512,1,512) # ResNet18 last layer size hardcoded
def copy_data(m,i,o):
    feature_vector.copy_(o.data)
h = layer.register_forward_hook(copy_data)
model(input_batch)
h.remove()
username = sys.argv[2]
dest = sys.argv[3] + '/'
dp = dest + username
pd.DataFrame(feature_vector.numpy().ravel()[0:87381]).to_csv(dp + '_fragment1.txt',
                                                                header=False,index=False)
pd.DataFrame(feature_vector.numpy().ravel()[87381:174762]).to_csv(dp + '_fragment2.txt',
                                                                    header=False,index=False)
pd.DataFrame(feature_vector.numpy().ravel()[174762:]).to_csv(dp + '_fragment3.txt',
                                                                header=False,index=False)
print("Feature extraction completed")
